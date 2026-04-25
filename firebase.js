    // Importa Firebase
    import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
    import { getFirestore } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

    // Configuração do seu projeto
    const firebaseConfig = {
        apiKey: "AIzaSyAn1e756_1-pDnhi1r2T_YQW-VByembalo",
        authDomain: "nexus-patrimonial-openai.firebaseapp.com",
        projectId: "nexus-patrimonial-openai",
        storageBucket: "nexus-patrimonial-openai.firebasestorage.app",
        messagingSenderId: "966396294783",
        appId: "1:966396294783:web:3667a8362a75ae9070f14a"
    };

    // Inicializa Firebase
    const app = initializeApp(firebaseConfig);

    // Inicializa banco de dados (Firestore)
    const db = getFirestore(app);

    console.log("Firebase conectado com sucesso");

    export { db };