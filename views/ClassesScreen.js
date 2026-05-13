import { Ionicons } from '@expo/vector-icons';
import { FlatList, Modal, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useMemo, useState } from 'react';
import { colors } from '../constants/colors';
import { strings } from '../constants/strings';
import { ajouterClasse } from '../controllers/classController';
import { useClasses } from '../hooks/useClasses';
import { getAllStudents } from '../models/studentModel';
import { Screen, Title, useThemeColors } from '../components/Themed';

export const ClassesScreen = ({ navigation }) => {
  const [sort, setSort] = useState('alpha');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [className, setClassName] = useState('');
  const [addError, setAddError] = useState('');
  const [saving, setSaving] = useState(false);
  const { width } = useWindowDimensions();
  const { classes, refresh } = useClasses(sort);
  const theme = useThemeColors();
  const columns = width >= 768 ? 2 : 1;
  const data = useMemo(() => classes, [classes]);
  const search = async (text) => {
    setQuery(text);
    const all = await getAllStudents();
    setResults(text.length < 2 ? [] : all.filter((s) => `${s.prenom} ${s.nom}`.toLowerCase().includes(text.toLowerCase())));
  };

  const openAddModal = () => {
    setClassName('');
    setAddError('');
    setAddModalVisible(true);
  };

  const closeAddModal = () => {
    if (saving) return;
    setAddModalVisible(false);
    setClassName('');
    setAddError('');
  };

  const submitClass = async () => {
    const normalizedName = className.trim();
    if (!normalizedName) {
      setAddError('Le nom de la classe est obligatoire.');
      return;
    }

    setSaving(true);
    setAddError('');
    try {
      await ajouterClasse(normalizedName);
      await refresh();
      setAddModalVisible(false);
      setClassName('');
    } catch (error) {
      setAddError(error.message || 'Impossible d ajouter la classe.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Title>{strings.classesTitle}</Title>
      <TextInput placeholder="Rechercher un élève" value={query} onChangeText={search} style={{ backgroundColor: theme.card, borderRadius: 20, padding: 14, marginBottom: 12, color: theme.text }} />
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        {['alpha', 'recent'].map((s) => <TouchableOpacity key={s} onPress={() => setSort(s)} style={{ backgroundColor: sort === s ? colors.primaryPink : colors.lightPink, borderRadius: 50, padding: 10 }}><Text style={{ color: sort === s ? colors.white : colors.deepPink }}>{s === 'alpha' ? 'A-Z' : 'Récent'}</Text></TouchableOpacity>)}
      </View>
      {results.map((s) => <TouchableOpacity key={s.id} onPress={() => navigation.navigate('StudentDetail', { studentId: s.id })}><Text style={{ color: theme.text, marginBottom: 8 }}>{s.prenom} {s.nom} - {s.classeNom}</Text></TouchableOpacity>)}
      <FlatList key={columns} data={data} numColumns={columns} keyExtractor={(item) => String(item.id)} initialNumToRender={8} getItemLayout={(_, index) => ({ length: 132, offset: 132 * index, index })} renderItem={({ item }) => (
        <TouchableOpacity onPress={() => navigation.navigate('ClassDashboard', { classe: item })} style={{ flex: 1, backgroundColor: theme.card, borderRadius: 20, padding: 18, margin: 6, shadowColor: colors.primaryPink, shadowOpacity: 0.14, shadowRadius: 10 }}>
          <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 20, color: theme.text }}>{item.nom}</Text>
          <Text style={{ color: theme.muted, marginTop: 8 }}>{item.nombreEleves} élèves</Text>
          <Text style={{ color: colors.deepPink, marginTop: 8 }}>Mérites {item.totalMerites} · Retenues {item.totalRetenues}</Text>
        </TouchableOpacity>
      )} />
      <TouchableOpacity
        accessibilityLabel={strings.addClass}
        testID="add-class-fab"
        onPress={openAddModal}
        style={{ position: 'absolute', right: 20, bottom: 24, backgroundColor: colors.primaryPink, width: 58, height: 58, borderRadius: 58, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name="add-outline" color={colors.white} size={32} />
      </TouchableOpacity>
      <Modal visible={addModalVisible} transparent animationType="slide" onRequestClose={closeAddModal}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 12 }}>
            <Text style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 22, color: theme.text }}>{strings.addClass}</Text>
            <TextInput
              autoFocus
              placeholder="Nom de la classe"
              placeholderTextColor={theme.muted}
              value={className}
              onChangeText={(text) => {
                setClassName(text);
                if (addError) setAddError('');
              }}
              style={{ backgroundColor: theme.bg, borderRadius: 14, padding: 14, color: theme.text }}
              testID="add-class-name-input"
            />
            {!!addError && <Text style={{ color: colors.deepPink }}>{addError}</Text>}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
              <TouchableOpacity disabled={saving} onPress={closeAddModal} style={{ backgroundColor: colors.lightPink, borderRadius: 50, paddingVertical: 12, paddingHorizontal: 18 }}>
                <Text style={{ color: colors.deepPink, fontFamily: 'NunitoSans_700Bold' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={saving} onPress={submitClass} style={{ backgroundColor: colors.primaryPink, borderRadius: 50, paddingVertical: 12, paddingHorizontal: 18, opacity: saving ? 0.7 : 1 }}>
                <Text style={{ color: colors.white, fontFamily: 'NunitoSans_700Bold' }}>{saving ? 'Ajout...' : 'Ajouter'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
};
