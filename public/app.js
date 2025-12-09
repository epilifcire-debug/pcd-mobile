// ============================================================
// 🕒 PONTO DIGITAL - APP.JS COMPLETO
// ============================================================

// 🌐 Ajuste conforme o backend hospedado
const API_URL = window.location.origin;
let token = null;
let usuarioAtual = null;

// ======= SELETORES =======
const loginSection = document.getElementById("login-section");
const pontoSection = document.getElementById("ponto-section");
const painelRH = document.getElementById("painel-rh");
const msgErro = document.getElementById("msg-erro");
const boasVindas = document.getElementById("boas-vindas");
const alertaFerias = document.getElementById("alerta-ferias");

// ============================================================
// 🔑 LOGIN
// ============================================================
document.getElementById("btn-login").addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim();

  if (!email || !senha) {
    msgErro.textContent = "Preencha todos os campos.";
    return;
  }

  try {
    const resp = await fetch(API_URL + "/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha }),
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || "Erro ao fazer login.");

    token = data.token;
    usuarioAtual = data.usuario;
    msgErro.textContent = "";

    if (["RH", "ADMIN"].includes(usuarioAtual.categoria)) {
      loginSection.classList.add("oculto");
      painelRH.classList.remove("oculto");
      carregarAbaFuncionarios();
    } else {
      loginSection.classList.add("oculto");
      pontoSection.classList.remove("oculto");
      boasVindas.textContent = `Olá, ${usuarioAtual.nome}`;
      verificarFerias();
    }
  } catch (err) {
    msgErro.textContent = err.message;
  }
});

// ============================================================
// 🔐 FÉRIAS E ALERTAS
// ============================================================
async function verificarFerias() {
  try {
    const resp = await fetch(API_URL + "/ferias/info", {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await resp.json();

    if (data.statusFerias && data.statusFerias.startsWith("⚠️")) {
      alertaFerias.classList.remove("oculto");
      alertaFerias.textContent = data.statusFerias;
    } else {
      alertaFerias.classList.add("oculto");
    }
  } catch (err) {
    console.error("Erro ao verificar férias:", err);
  }
}

// ============================================================
// 📸 REGISTRAR PONTO
// ============================================================
async function capturarFoto() {
  return new Promise((resolve, reject) => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        const video = document.createElement("video");
        video.srcObject = stream;
        video.play();
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        setTimeout(() => {
          context.drawImage(video, 0, 0, 320, 240);
          stream.getTracks().forEach((t) => t.stop());
          canvas.toBlob(resolve, "image/jpeg", 0.8);
        }, 1500);
      })
      .catch(reject);
  });
}

async function registrarPonto(tipo) {
  try {
    const fotoBlob = await capturarFoto();
    const formData = new FormData();
    formData.append("tipo", tipo);
    if (fotoBlob) formData.append("foto", fotoBlob, "ponto.jpg");

    const resp = await fetch(API_URL + "/ponto/registrar", {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
      body: formData,
    });

    const data = await resp.json();
    if (resp.ok) alert("✅ Ponto registrado com sucesso!");
    else alert("Erro: " + (data.error || "Falha desconhecida"));
  } catch (err) {
    alert("Erro: " + err.message);
  }
}

document.getElementById("btn-entrada").addEventListener("click", () => registrarPonto("entrada"));
document.getElementById("btn-saida").addEventListener("click", () => registrarPonto("saida"));

document.getElementById("btn-intervalo").addEventListener("click", () => {
  alert("⏳ Intervalo de 15 minutos iniciado!");
  setTimeout(() => {
    alert("⚠️ Intervalo finalizado. Retorne ao trabalho!");
  }, 15 * 60 * 1000);
});

// ============================================================
// 🧩 PAINEL RH - ABAS
// ============================================================
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((t) => t.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");

    if (btn.dataset.tab === "tab-funcionarios") carregarAbaFuncionarios();
    if (btn.dataset.tab === "tab-status") carregarStatusAdmin();
  });
});

// ============================================================
// 👥 RH - LISTA DE FUNCIONÁRIOS
// ============================================================
async function carregarAbaFuncionarios() {
  try {
    const resp = await fetch(API_URL + "/admin/funcionarios", {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await resp.json();
    const tbody = document.querySelector("#tabela-funcionarios tbody");
    tbody.innerHTML = "";

    data.forEach((u) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${u.nome}</td>
        <td>${u.categoria}</td>
        <td>${u.turno}</td>
        <td>${u.dataAdmissao}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Erro ao carregar funcionários:", err);
  }
}

// ============================================================
// ➕ CADASTRO DE FUNCIONÁRIO (RH/Admin)
// ============================================================
const modal = document.getElementById("modal-cadastro");
const btnNovo = document.getElementById("btn-novo-funcionario");
const btnSalvar = document.getElementById("btn-salvar-func");
const btnFechar = document.getElementById("btn-fechar-modal");
const selectCategoria = document.getElementById("cad-categoria");
const selectTurno = document.getElementById("cad-turno");

btnNovo.addEventListener("click", () => modal.classList.remove("oculto"));
btnFechar.addEventListener("click", () => modal.classList.add("oculto"));

selectCategoria.addEventListener("change", () => {
  if (selectCategoria.value === "VENDEDOR") selectTurno.classList.remove("oculto");
  else selectTurno.classList.add("oculto");
});

btnSalvar.addEventListener("click", async () => {
  const nome = document.getElementById("cad-nome").value.trim();
  const email = document.getElementById("cad-email").value.trim();
  const cpf = document.getElementById("cad-cpf").value.trim();
  const telefone = document.getElementById("cad-telefone").value.trim();
  const categoria = selectCategoria.value;
  const turno = selectTurno.value;

  if (!nome || !email || !cpf || !telefone || !categoria) {
    alert("Preencha todos os campos obrigatórios.");
    return;
  }

  try {
    const resp = await fetch(API_URL + "/admin/criar-funcionario", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ nome, email, cpf, telefone, categoria, turno }),
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || "Erro ao cadastrar");

    alert(`✅ Funcionário cadastrado!\nSenha: ${data.senhaGerada}`);
    modal.classList.add("oculto");
    carregarAbaFuncionarios();
  } catch (err) {
    alert(err.message);
  }
});

// ============================================================
// 📊 RH - STATUS ADMINISTRATIVO
// ============================================================
async function carregarStatusAdmin() {
  try {
    const resp = await fetch(API_URL + "/admin/status", {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await resp.json();

    const resumo = `
      <div class="status-card">👥 Funcionários<br>${data.funcionariosAtivos}</div>
      <div class="status-card">🕒 Pontos Hoje<br>${data.pontosHoje}</div>
      <div class="status-card">🌴 Férias Pendentes<br>${data.feriasPendentes}</div>
      <div class="status-card">🕓 Atualizado<br>${new Date(data.ultimaAtualizacao).toLocaleTimeString()}</div>
    `;
    document.getElementById("status-resumo").innerHTML = resumo;

    const logs = data.logsRecentes.map((l) => `<li>${l}</li>`).join("");
    document.getElementById("status-logs").innerHTML = logs;

    const fotos = data.fotosRecentes
      .map((f) => `<img src="${f}" alt="Foto de ponto">`)
      .join("");
    document.getElementById("status-fotos").innerHTML = fotos;
  } catch (err) {
    console.warn("Erro ao carregar status:", err);
  }
}

// Atualização automática da aba “Status” a cada 10s
setInterval(() => {
  const abaAtiva = document.querySelector(".tab-content.active");
  if (abaAtiva && abaAtiva.id === "tab-status") carregarStatusAdmin();
}, 10000);

// ============================================================
// 📦 EXPORTAÇÃO CSV (Servidor)
// ============================================================
document.getElementById("btn-exportar-csv").addEventListener("click", async () => {
  try {
    const resp = await fetch(API_URL + "/admin/exportar", {
      headers: { Authorization: "Bearer " + token },
    });
    if (!resp.ok) {
      alert("Erro ao gerar relatório.");
      return;
    }

    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Relatorio_PontoDigital_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Erro ao baixar relatório:", err);
    alert("Falha ao baixar o relatório CSV.");
  }
});
