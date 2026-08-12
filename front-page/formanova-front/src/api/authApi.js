// // Mock temporaire — à remplacer par de vrais appels fetch/axios vers ton API
// // Django REST Framework / FastAPI une fois le backend prêt.
// // Le contrat (forme des données retournées) reste le même : ça limite
// // le code à changer plus tard.

// import { MOCK_USERS } from "./mockData";

// function fakeDelay(ms = 500) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }
 
// function fakeToken(identifiant) {
//   // Un vrai backend renverrait un JWT signé. Ici on simule juste une chaîne.
//   return btoa(`${identifiant}:${Date.now()}`);
// }

// // à remplacer quand mon back-end sera prêt
// export async function login(identifiant, motDePasse) {
//   await fakeDelay();
 
//   const user = MOCK_USERS.find(
//     (u) => u.identifiant === identifiant && u.motDePasse === motDePasse
//   );
 
//   if (!user) {
//     const error = new Error("Identifiant ou mot de passe incorrect.");
//     error.code = "INVALID_CREDENTIALS";
//     throw error;
//   }
 
//   const { motDePasse: _omit, ...userWithoutPassword } = user;
 
//   return {
//     token: fakeToken(user.identifiant),
//     user: userWithoutPassword,
//   };
// }
 
// export async function getProfil(role) {
//   await fakeDelay(300);
//   const user = MOCK_USERS.find((u) => u.role === role);
//   const { motDePasse: _omit, ...userWithoutPassword } = user;
//   return userWithoutPassword;
// }