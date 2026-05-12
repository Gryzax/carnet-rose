export const nowIso = () => new Date().toISOString();
export const secondsBetween = (fromIso, to = new Date()) => Math.floor((to.getTime() - new Date(fromIso).getTime()) / 1000);
