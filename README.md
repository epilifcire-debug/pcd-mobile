# 🕒 Ponto Digital

Sistema completo de **ponto digital online** para pequenas empresas, com registro de entrada e saída via foto, controle de banco de horas, cálculo de férias automático e painel RH integrado.

---

## 🚀 Funcionalidades

### 👷 Funcionário
- Login seguro com **JWT**
- Registro de **entrada** e **saída** com **foto automática (Cloudinary)**
- Controle de **intervalo de 15 minutos**
- Alerta automático de **férias vencidas ou próximas**
- Solicitação de **férias (15 ou 30 dias)**
- Exibição do **banco de horas**
- Totalmente adaptado para **uso mobile**

### 👩‍💼 RH / Admin
- Painel embutido no mesmo sistema (sem outro login)
- Cadastro automático e exibição de funcionários
- Lista de **pontos diários** com filtros
- **Aprovação/Rejeição de férias**
- **Banco de horas consolidado**
- Ícones de status de férias: 🟩 dentro do prazo, 🟧 próximas, 🟥 vencidas

---

## 🧱 Estrutura do Projeto

ponto-digital/
├── server.js
├── package.json
├── .env # ⚠️ NÃO subir no GitHub
├── .gitignore
├── .env.example
└── public/


---

## ⚙️ Tecnologias

| Área | Tecnologias |
|------|--------------|
| Backend | Node.js + Express |
| Banco de Dados | MongoDB Atlas (via Mongoose) |
| Uploads | Cloudinary (multer-storage-cloudinary) |
| Autenticação | JWT (jsonwebtoken) |
| Segurança | Criptografia AES-256-CBC + Bcrypt |
| Frontend | HTML, CSS, JS (mobile-first) |

---

## 🧩 Instalação e Configuração

### 1️⃣ Clonar o repositório
```bash
git clone https://github.com/seuusuario/ponto-digital.git
cd ponto-digital

├── index.html
├── style.css
└── app.js

MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/ponto-digital
CLOUDINARY_CLOUD_NAME=djln3mjwd
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=sua_api_secret
JWT_SECRET=sua_chave_segura
ENCRYPT_KEY=sua_chave_aes_64_hex
PORT=3000

🧮 Cálculo de Férias

A cada 12 meses trabalhados, o funcionário adquire 30 dias de férias.

O sistema calcula automaticamente o ciclo aquisitivo e o vencimento (12 meses após o direito).

Se o funcionário não tirar férias dentro do prazo → alerta “⚠️ Férias vencidas há X dias”.

📷 Registro de Ponto com Foto

Ao clicar em Bater Entrada ou Bater Saída, o sistema solicita permissão da câmera.

A foto é capturada automaticamente e enviada ao Cloudinary junto com o horário.

Os dados são salvos no MongoDB com hora, data e link da imagem.

🧑‍💼 Painel RH / Admin

Acesso embutido dentro do app (card “Painel RH” visível apenas para RH/Admin)

Gerenciamento de:

Funcionários (com ícones de status de férias)

Pontos diários

Férias pendentes

Banco de horas consolidado

🔐 Segurança

Todas as rotas protegidas com JWT

Dados sensíveis (CPF, telefone) criptografados com AES-256-CBC

Senhas protegidas com bcrypt

.env fora do controle de versão (.gitignore)

🌈 Layout

Design mobile-first

Cabeçalho fixo com degradê roxo → laranja

Logos: “Point do Ingresso” + “Pré-Caju”

Interface minimalista e responsiva

🧠 Sugestão de Melhoria (futuro)

Implementar upload de documento de comprovante de ponto

Geração de relatórios em PDF

Módulo de notificações automáticas por e-mail (feriados, vencimentos)

Integração com API de feriados nacionais

🧾 Licença

Distribuído sob licença MIT.
© 2025 — Desenvolvido por Eric Filipe.
