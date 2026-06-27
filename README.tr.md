# PharmaGuard

PharmaGuard, ilaç tedarik zincirindeki sahtecilik ve klon/çift harcama senaryolarını tespit etmek için tasarlanmış, Monad testnet üzerinde çalışan bir demo projesidir. Proje, akıllı sözleşme tabanlı ürün takibi, arka uç veri işleme, gerçek zamanlı grafik görselleştirme ve AI destekli risk tespiti mantığını bir araya getirir.

## Proje Özeti

PharmaGuard, aşağıdaki akışı simüle eder:

1. Üretici ürün üretir ve zincire ekler.
2. Ürün transfer edilir.
3. Transfer geçmişi ve lokasyon bilgileri izlenir.
4. Anormal bir senaryo tespit edilirse sistem ürünü dondurur.
5. Frontend ekranında zincir, transfer grafiği ve risk durumu canlı olarak görüntülenir.

Bu demo, özellikle "bayat sahipten tekrar transfer" gibi sahtecilik senaryolarını göstermek için hazırlanmıştır.

## Ana Özellikler

- ERC1155 tabanlı akıllı sözleşme ile ürün takibi
- FastAPI tabanlı backend ve WebSocket desteği
- React/Next.js tabanlı operasyon konsolu
- Transfer geçmişini ve düğüm/kenar yapısını gösteren grafik görselleştirme
- Sahtecilik / klon senaryosu için risk tespiti
- Monad testnet üzerinde çalışmaya uygun yapı

## Mimari Genel Bakış

- Backend: Python, FastAPI, Web3.py, NetworkX
- Frontend: Next.js, React, TypeScript
- Smart Contracts: Solidity, Foundry
- Veri akışı:
  - Frontend operasyonları backend API üzerinden gönderir
  - Backend transferleri akıllı sözleşme ile işler
  - Transferler detector ve graph store üzerinden değerlendirilir
  - Sonuçlar WebSocket üzerinden canlı olarak frontend'e iletilir

## Klasör Yapısı

```text
pharmaGuard/
├── backend/          # FastAPI backend
├── contracts/        # Solidity + Foundry kontratları
├── frontend/         # Next.js arayüz
├── scripts/          # Yardımcı scriptler
└── .env.example      # Çevre değişkenleri örneği
```

## Ön Koşullar

Aşağıdakilerin kurulu olması gerekir:

- Python 3.11+
- Node.js 20+
- npm veya pnpm
- Foundry (forge, cast)

## Kurulum

### 1) Projeyi klonlayın

```bash
git clone https://github.com/SeferCinar/pharmaGuard.git
cd pharmaGuard
```

### 2) Çevre değişkenlerini hazırlayın

```bash
cp .env.example .env
```

Ardından .env dosyasını düzenleyin. Özellikle şu alanları doldurun:

- MONAD_RPC_URL
- CONTRACT_ADDRESS
- ADMIN_PK
- ORACLE_PK
- MANUFACTURER_PK
- DISTRIBUTOR_PK
- PHARMACY_A_PK
- PHARMACY_B_PK

> Not: Demo anahtarları testnet amaçlıdır. Gerçek anahtarları asla paylaşmayın.

### 3) Backend kurulumu

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Linux/macOS
# .venv\Scripts\activate    # Windows PowerShell
pip install -e ".[dev]"
```

### 4) Frontend kurulumu

```bash
cd ../frontend
npm install
```

### 5) Akıllı sözleşmeleri hazırlayın

```bash
cd ../contracts
forge install
```

## Çalıştırma

### Backend

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm run dev
```

Ardından tarayıcıda:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API dokümantasyonu: http://localhost:8000/docs

## Smart Contract Dağıtımı

Foundry ile kontrat dağıtımı şu şekilde yapılabilir:

```bash
cd contracts
forge script script/Deploy.s.sol:Deploy --rpc-url "$MONAD_RPC_URL" --broadcast
```

Dağıtım sonrası kontrat adresini .env dosyasındaki CONTRACT_ADDRESS alanına yazın.

Ayrıca rol kayıtlarını eklemek için:

```bash
forge script script/SeedRoles.s.sol:SeedRoles --rpc-url "$MONAD_RPC_URL" --broadcast
```

## Demo Akışı

Frontend üzerinde aşağıdaki adımların sırasıyla denenmesi önerilir:

1. Üretim adımı ile ürün mint edilir.
2. Üretici → Dağıtıcı transferi yapılır.
3. Dağıtıcı → Eczane A transferi yapılır.
4. Üretici → Eczane B transferi ile klon senaryosu tetiklenir.
5. Sistem riskli davranışı tespit eder ve ürün dondurulur.

## Testler

Backend testleri:

```bash
cd backend
pytest
```

## Notlar

- Proje demo amaçlıdır ve üretim ortamı için ek güvenlik, doğrulama ve operasyonel kontroller gerektirir.
- Risk algılama mantığı, mevcut proje kapsamına göre basit ve açıklayıcı bir yaklaşım sunar.
- GNN katmanı, gelecekte geliştirme için ayrılmış bir uzantı seam olarak mevcuttur.
