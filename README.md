# VectorCash

**URL**: [vectorcash.net](https://vectorcash.net)

VectorCash is a personal finance tracker that allows users to log, visualize, and manage their financial accounts. With an intuitive interface and real-time charting, users can monitor their assets, liabilities, and net worth effortlessly.

---

## 🧩 Features

- **Daily Balance Tracking**  
  Log the daily balances of various accounts like checking, savings, credit cards, loans, and investments.

- **Account Management**  
  Add, edit, or remove financial accounts. Accounts are categorized and classified as assets or liabilities.

- **Interactive Charts**  
  View visual representations of financial trends including account growth, decay, and net worth using D3.js.

- **Data Persistence**  
  Offline support and local storage of entries using IndexedDB via Dexie.js.

---

## 🧱 Data Models

### 📁 AccountCategory

| Field         | Type    | Description                                |
| ------------- | ------- | ------------------------------------------ |
| `id`          | number  | Unique identifier                          |
| `name`        | string  | Category name (e.g. "Checking", "Savings") |
| `type`        | string  | `"Asset"` or `"Liability"`                 |
| `description` | string  | (Optional) Description                     |
| `isActive`    | boolean | Flag for active/deleted status             |

### 🏦 Account

| Field        | Type    | Description                          |
| ------------ | ------- | ------------------------------------ |
| `id`         | number  | Unique identifier                    |
| `name`       | string  | Account name (e.g. "Chase Checking") |
| `categoryId` | number  | Foreign key to `AccountCategory`     |
| `isActive`   | boolean | Flag for active/deleted status       |

### 📈 Entry

| Field       | Type   | Description                   |
| ----------- | ------ | ----------------------------- |
| `id`        | number | Unique identifier             |
| `date`      | string | Format: `MM/DD/YYYY`          |
| `accountId` | number | Foreign key to `Account`      |
| `balance`   | number | Daily balance for the account |

---

## 🌐 Pages

- **Home Page**  
  Landing page introducing VectorCash.

- **Dashboard Page**  
  Displays:
  - Account balances
  - Daily log entries
  - Interactive line chart (via D3.js)
  - Net worth calculations

---

## 🛠️ Tech Stack

| Layer              | Technology                                      |
| ------------------ | ----------------------------------------------- |
| Frontend Framework | [Angular](https://angular.io)                   |
| UI Components      | [Angular Material](https://material.angular.io) |
| Data Storage       | [Dexie.js](https://dexie.org) (IndexedDB)       |
| Charting           | [D3.js](https://d3js.org)                       |

---

## 🚀 Getting Started

1. Clone the repo:

```bash
git clone https://github.com/aribbabar/vector-cash
cd vectorcash
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
ng serve
```

4. Open your browser and navigate to:

```
http://localhost:4200
```

## 🧪 Running Tests

```bash
# Run unit tests
ng test

# Run end-to-end tests
ng e2e
```

## 📦 Building for Production

```bash
ng build --prod
```

The build artifacts will be stored in the `dist/` directory.
