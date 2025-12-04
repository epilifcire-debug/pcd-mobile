# pcd-eventos-frontend

# 💼 Sistema PCD — Eventos

![Logo do Sistema](logo.png)

Sistema completo de **gestão de eventos e cadastro de pessoas com deficiência (PCD)**.  
Desenvolvido para administração, controle e acompanhamento de eventos, com upload de documentos, relatórios em PDF, e painel administrativo seguro.

---

## 🚀 Funcionalidades

✅ **Autenticação segura (JWT)**  
- Login com níveis de permissão (admin / usuário)  
- Proteção de rotas e logout seguro  

✅ **Cadastro de Eventos**  
- Criação, edição e exclusão de eventos  
- Ordenação automática por data  
- Listagem simples e limpa  

✅ **Cadastro de Pessoas**  
- Campos: Nome, CPF, Telefone, Descrição  
- Associação de múltiplos eventos  
- Upload obrigatório dos documentos:
  - Requerimento  
  - Foto  
  - Documento Oficial  
  - Laudo Médico  
  - CadÚnico  
  - Comprovante de Residência  
  - (Opcional) Cartão BPC  
- Verificação visual 🟢/🔴 conforme status dos documentos  

✅ **Relatórios**
- Filtro por evento  
- Impressão direta ou exportação em PDF  
- Linhas de assinatura automáticas  
- Exportar / Importar backup JSON  

✅ **Painel Administrativo**
- Criação e gerenciamento de usuários  
- Controle de permissões e status ativo/inativo  

✅ **Interface Moderna**
- Layout gradiente com tema claro 🌞 e escuro 🌙  
- Totalmente responsivo (desktop e mobile)  
- Design leve e otimizado para GitHub Pages  

---

## ⚙️ Tecnologias Utilizadas

- **Frontend:** HTML5, CSS3, JavaScript (ES6)  
- **Bibliotecas:** jsPDF (geração de PDF)  
- **Backend:** Node.js + Express (em `https://pcd-eventos.onrender.com`)  
- **Banco de Dados:** SQLite / PostgreSQL (Render)  
- **Hospedagem:** GitHub Pages (frontend) + Render (backend)

---
pcd-eventos-frontend/
│
├── index.html # Estrutura principal
├── style.min.css # Estilos otimizados
├── app.min.js # Lógica e integrações (minificada)
├── logo.png # Logo Pré-Caju
└── README.md # Documentação
## 🧠 Estrutura do Projeto

