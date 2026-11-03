# ApexLogix – Enterprise Multi-Branch Inventory, Supply Chain & POS Management System

ApexLogix is a web-based, multi-branch inventory, supply chain, and Point-of-Sale (POS) management system designed to streamline retail operations, stock movements, and financial audit workflows.

---

## 🌟 Core Overview & Capabilities

* **Multi-Branch Inventory Control:** Real-time stock isolation and tracking across central warehouses and retail store outlets (`tbl_branches`), with dual-bucket accounting for sellable and non-sellable/damaged items.
* **Supply Chain & Procurement:** End-to-end purchasing lifecycle including vendor category mapping, multi-item Purchase Orders (POs), inbound Goods Receipt Notes (GRN), and Return to Vendor (RTV) claims.
* **Point of Sale (POS) Register:** Store-isolated checkout terminal supporting Senior/PWD discount calculations, barcode scanning, and multi-payment workflows (Cash vs. Accounts Receivable).
* **Stock Releases & Store Transfers:** Inter-branch multi-item dispatch vouchers and store-to-warehouse return slip processing.
* **Cycle Counting & Auditing:** Blind physical inventory count sessions with automated system snapshot comparison and variance logging.
* **Accounts Receivable & Analytics:** Customer credit ledger management (AR), sales revenue analytics, monthly stock shrinkage loss calculations, and full audit logs.

---

## 🏗️ System Architecture

```text
apexlogix/
├── db_apexlogix.sql           # Database schema & initial seeding SQL script
├── index.html                 # Primary UI layout, modals, and single-page container
├── js/
│   ├── index.js               # Main frontend coordinator & tab navigation switcher
│   └── modules/               # Modular ES6 frontend modules
│       ├── stores.js          # Store Outlets management module
│       ├── transfers.js       # Stock Releases & Store Return vouchers module
│       ├── pos.js             # Terminal register, shopping cart & discount calculations
│       ├── products.js        # Product Catalog master & UOM conversions
│       ├── categories.js      # Product Category master management
│       ├── suppliers.js       # Supplier accounts & category mappings
│       ├── ar.js              # Accounts Receivable ledger & payments
│       ├── receiving.js       # Inbound Goods Receipt & PO receiving
│       ├── counts.js          # Blind Cycle Count auditing
│       ├── reports.js         # On-hand quantity & shrinkage loss analytics
│       ├── archive.js         # Soft-deleted records recovery
│       ├── inventory.js       # Stock level & inventory overview module
│       ├── po.js              # Purchase Orders creation & tracking module
│       └── logs.js            # System audit logs viewer
└── api/                       # RESTful PHP backend endpoints (PDO)
    ├── connection-pdo.php     # Database PDO connection instance
    ├── StockManager.php       # Unified inventory adjustment & movement class
    ├── products.php           # Product catalog & stock movement API
    ├── transfers.php          # Store release vouchers & branch CRUD API
    ├── pos.php                # Sales transaction processing API
    ├── dashboard.php          # Revenue, KPI, and near-expiry alerts API
    ├── categories.php         # Category master API
    ├── suppliers.php          # Supplier accounts API
    ├── customers.php          # Customer profiles & AR accounts API
    ├── ar.php                 # Accounts Receivable settlements API
    ├── inventory_counts.php   # Cycle count sessions API
    ├── reports.php            # Shrinkage & inventory reports API
    ├── archive.php            # System archive & recovery API
    ├── inventory.php          # Inventory adjustments API
    ├── po.php                 # Purchase Orders API
    └── logs.php               # System logs & audit history API