import { db } from "./firebase.js";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

const inputMes = document.getElementById("mesFiltro");
const btnGerarMes = document.getElementById("btnGerarMes");

function obterMesAnterior(mes) {
    const [ano, mesNum] = mes.split("-").map(Number);
    let novoMes = mesNum - 1;
    let novoAno = ano;
    if (novoMes === 0) {
        novoMes = 12;
        novoAno--;
    }
    return `${novoAno}-${String(novoMes).padStart(2, "0")}`;
}

btnGerarMes.addEventListener("click", async () => {
    const mesAtualSelecionado = inputMes.value;
    const mesAnterior = obterMesAnterior(mesAtualSelecionado);

    console.log("Mês atual:", mesAtualSelecionado);
    console.log("Mês anterior:", mesAnterior);

    const q = query(
        collection(db, "ativos"),
        where("mes", "==", mesAnterior)
    );

    const querySnapshot = await getDocs(q);

    console.log("Quantidade encontrados no mês anterior:", querySnapshot.size);
});

// pega mês atual no formato YYYY-MM
const hoje = new Date();
const mesAtual = hoje.toISOString().slice(0, 7);

// variável global de controle
let mesSelecionado = mesAtual;

// define o valor inicial no input
inputMes.value = mesAtual;

inputMes.addEventListener("change", () => {
    mesSelecionado = inputMes.value;

    console.log("Mês selecionado:", mesSelecionado);

    // recarrega os dados na tela
    listarImoveis();
});

async function cadastrarImovel() {
    try {
        const nome = document.getElementById("nome").value;
        const valor = document.getElementById("valor").value;

        if (nome === "" || valor === "") {
            alert("Preencha todos os campos");
            return;
        }

        const hoje = new Date();
        const mesAtual = hoje.getFullYear() + "-" + String(hoje.getMonth() + 1).padStart(2, '0');

        await addDoc(collection(db, "ativos"), {
            nome: nome,
            valor_aluguel: Number(valor),
            ativo: true,
            status: "pendente",
            mes: mesSelecionado
        });

        document.getElementById("nome").value = "";
        document.getElementById("valor").value = "";

        alert("Imóvel cadastrado com sucesso");

        listarImoveis();

    } catch (erro) {
        console.error("Erro ao cadastrar:", erro);
    }
}

async function excluirImovel(id) {
    try {
        await deleteDoc(doc(db, "ativos", id));
        alert("Imóvel excluído");
        listarImoveis();
    } catch (erro) {
        console.error("Erro ao excluir:", erro);
    }
}

async function editarImovel(id, nomeAtual, valorAtual) {
    const novoNome = prompt("Editar nome do imóvel:", nomeAtual);
    const novoValor = prompt("Editar valor do aluguel:", valorAtual);

    if (novoNome === null || novoValor === null) {
        return;
    }

    if (novoNome === "" || novoValor === "") {
        alert("Valores inválidos");
        return;
    }

    try {
        await updateDoc(doc(db, "ativos", id), {
            nome: novoNome,
            valor_aluguel: Number(novoValor)
        });

        alert("Imóvel atualizado");
        listarImoveis();

    } catch (erro) {
        console.error("Erro ao editar:", erro);
    }
}

async function listarImoveis() {

    const pendente = document.getElementById("pendente");
    const recebido = document.getElementById("recebido");

    pendente.innerHTML = "";
    recebido.innerHTML = "";

    // 🔥 ADICIONE AQUI
    let totalPendente = 0;
    let totalRecebido = 0;

    const querySnapshot = await getDocs(collection(db, "ativos"));

    querySnapshot.forEach((docItem) => {
        const data = docItem.data();
        const id = docItem.id;

        console.log("Item:", data.nome, "| mês:", data.mes);

        const hoje = new Date();
        const mesAtual = hoje.getFullYear() + "-" + String(hoje.getMonth() + 1).padStart(2, '0');

        if (data.mes !== mesSelecionado) {
            return;
        }
        
        const item = document.createElement("div");
        item.classList.add("card");

        if (data.status === "recebido") {
            item.innerHTML = `
                <h3>${data.nome}</h3>
                <p><strong>Aluguel:</strong> R$ ${data.valor_aluguel}</p>

                <button onclick="desfazerBaixa('${id}')">
                    ↩️ Desfazer
                </button>

                <button onclick="editarImovel('${id}', '${data.nome}', ${data.valor_aluguel})">
                    Editar
                </button>

                <button onclick="excluirImovel('${id}')">
                    Excluir
                </button>
            `;
        } else {
            item.innerHTML = `
                <h3>${data.nome}</h3>
                <p><strong>Aluguel:</strong> R$ ${data.valor_aluguel}</p>

                <button onclick="darBaixa('${id}')">
                    💰 Dar baixa
                </button>

                <button onclick="editarImovel('${id}', '${data.nome}', ${data.valor_aluguel})">
                    Editar
                </button>

                <button onclick="excluirImovel('${id}')">
                    Excluir
                </button>
            `;
        }

        if (data.status === "recebido") {
            recebido.appendChild(item);
            totalRecebido += data.valor_aluguel;
        } else {
            pendente.appendChild(item);
            totalPendente += data.valor_aluguel;
        }
    });

    const totalP = document.createElement("p");
    totalP.innerHTML = "<strong>Total: R$ " + totalPendente + "</strong>";
    pendente.appendChild(totalP);

    const totalR = document.createElement("p");
    totalR.innerHTML = "<strong>Total: R$ " + totalRecebido + "</strong>";
    recebido.appendChild(totalR);
}

document.getElementById("btnCadastrar").addEventListener("click", cadastrarImovel);

window.excluirImovel = excluirImovel;
window.editarImovel = editarImovel;

async function darBaixa(id) {
    try {
        await updateDoc(doc(db, "ativos", id), {
            status: "recebido"
        });

        listarImoveis();
    } catch (erro) {
        console.error("Erro ao dar baixa:", erro);
    }
}

async function desfazerBaixa(id) {
    try {
        await updateDoc(doc(db, "ativos", id), {
            status: "pendente"
        });

        listarImoveis();
    } catch (erro) {
        console.error("Erro ao desfazer baixa:", erro);
    }
}

window.darBaixa = darBaixa;

window.desfazerBaixa = desfazerBaixa;

listarImoveis();

