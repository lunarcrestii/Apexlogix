-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 29, 2026 at 04:16 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_apexlogix`
--

-- --------------------------------------------------------

--
-- Table structure for table `tbl_accounts_receivable`
--

CREATE TABLE `tbl_accounts_receivable` (
  `ar_id` int(11) NOT NULL,
  `transaction_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `amount_due` decimal(10,2) NOT NULL,
  `status` enum('UNPAID','PAID') DEFAULT 'UNPAID',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_accounts_receivable`
--

INSERT INTO `tbl_accounts_receivable` (`ar_id`, `transaction_id`, `customer_id`, `amount_due`, `status`, `created_at`) VALUES
(1, 1, 1, 56.00, 'PAID', '2026-10-20 19:32:08'),
(2, 3, 1, 750.00, 'PAID', '2026-10-20 20:51:45'),
(3, 7, 2, 420.00, 'PAID', '2026-10-21 16:58:42');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_audit_logs`
--

CREATE TABLE `tbl_audit_logs` (
  `log_id` int(11) NOT NULL,
  `module` varchar(50) DEFAULT NULL,
  `action_taken` varchar(255) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_audit_logs`
--

INSERT INTO `tbl_audit_logs` (`log_id`, `module`, `action_taken`, `details`, `timestamp`) VALUES
(1, 'AUTH', 'LOGIN', 'Admin user logged into system dashboard.', '2026-10-20 11:32:08');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_batches`
--

CREATE TABLE `tbl_batches` (
  `batch_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `lot_number` varchar(50) NOT NULL,
  `expiry_date` date NOT NULL,
  `quantity` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_batches`
--

INSERT INTO `tbl_batches` (`batch_id`, `product_id`, `branch_id`, `lot_number`, `expiry_date`, `quantity`, `created_at`) VALUES
(1, 1, 1, 'LOT-20261019-01', '2027-10-19', 35.00, '2026-10-20 11:32:08'),
(2, 1, 1, '2', '2026-11-07', 0.00, '2026-10-20 11:35:34'),
(3, 2, 1, '1', '2027-10-20', 50.00, '2026-10-20 12:05:11'),
(4, 2, 1, '2', '2027-05-11', 0.00, '2026-10-20 12:18:34'),
(5, 2, 1, '3', '2026-10-20', 0.00, '2026-10-20 12:47:15'),
(6, 2, 1, '4', '2026-10-22', 0.00, '2026-10-20 12:47:46'),
(8, 2, 1, '5', '2027-10-20', 5.00, '2026-10-20 13:16:27'),
(9, 2, 1, '6', '2027-05-20', 5.00, '2026-10-20 13:23:24'),
(10, 4, 1, '1', '2028-06-21', 30.00, '2026-10-21 08:16:43'),
(11, 6, 1, '1', '2027-01-21', 20.00, '2026-10-21 08:21:14'),
(12, 6, 1, '2', '2026-10-30', 20.00, '2026-10-21 08:21:54'),
(13, 7, 1, '1', '2026-11-07', 0.00, '2026-10-21 08:40:40'),
(14, 2, 1, '7', '2028-10-21', 5.00, '2026-10-21 08:42:29'),
(15, 2, 1, '8', '2026-10-09', 0.00, '2026-10-21 08:42:42'),
(16, 2, 1, '9', '2029-11-21', 5.00, '2026-10-21 08:43:40'),
(17, 7, 1, '2', '2026-11-07', 0.00, '2026-10-21 08:48:45'),
(18, 8, 1, '1', '2026-11-01', 134.00, '2026-10-21 08:55:29'),
(19, 7, 1, '3', '2026-10-22', 0.00, '2026-10-22 03:25:59'),
(20, 10, 1, '1', '2028-03-22', 15.00, '2026-10-22 03:32:23'),
(21, 10, 1, '2', '2026-11-26', 5.00, '2026-10-22 03:33:43'),
(22, 7, 1, '4', '2026-10-31', 0.00, '2026-10-28 12:07:34'),
(23, 1, 1, '3', '2026-11-07', 0.00, '2026-10-28 12:07:34'),
(24, 2, 1, '10', '2026-11-07', 0.00, '2026-10-28 12:07:34'),
(25, 7, 1, '5', '2026-11-06', 20.00, '2026-10-28 12:11:25'),
(26, 1, 1, '4', '2026-11-05', 30.00, '2026-10-28 12:11:25'),
(27, 2, 1, '11', '2026-11-07', 30.00, '2026-10-28 12:11:25'),
(28, 7, 1, '6', '2026-11-07', 20.00, '2026-10-28 12:22:15'),
(29, 1, 1, '5', '2026-11-07', 50.00, '2026-10-28 12:22:15'),
(30, 2, 1, '12', '2026-11-07', 50.00, '2026-10-28 12:22:15');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_branches`
--

CREATE TABLE `tbl_branches` (
  `branch_id` int(11) NOT NULL,
  `branch_code` varchar(20) NOT NULL,
  `branch_name` varchar(100) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_branches`
--

INSERT INTO `tbl_branches` (`branch_id`, `branch_code`, `branch_name`, `is_active`) VALUES
(1, 'BR-001', 'Handsome Branch', 1),
(2, 'BR-002', 'Kulas Store', 1),
(3, 'BR-003', 'Gwapo123 Store', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_categories`
--

CREATE TABLE `tbl_categories` (
  `category_id` int(11) NOT NULL,
  `category_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_categories`
--

INSERT INTO `tbl_categories` (`category_id`, `category_name`, `description`, `is_active`) VALUES
(1, 'Beverages', 'Cold and hot drinks section', 1),
(2, 'Technology and Tools', 'Items', 1),
(3, 'Snacks', 'Chips and Crisp', 1),
(5, 'Can Goods', 'Delata', 1),
(6, 'Fruits', 'Prutas', 1),
(7, 'PlasticWare', 'Plastic Containers and etc.', 1),
(10, 'cantoon', 'can goods', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_count_sessions`
--

CREATE TABLE `tbl_count_sessions` (
  `session_id` int(11) NOT NULL,
  `session_no` varchar(50) NOT NULL,
  `branch_id` int(11) NOT NULL DEFAULT 1,
  `status` enum('Draft','In Progress','Pending Approval','Completed','Cancelled') NOT NULL DEFAULT 'In Progress',
  `counted_by` int(11) NOT NULL DEFAULT 1,
  `approved_by` int(11) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `completed_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_count_sessions`
--

INSERT INTO `tbl_count_sessions` (`session_id`, `session_no`, `branch_id`, `status`, `counted_by`, `approved_by`, `note`, `created_at`, `completed_at`) VALUES
(1, 'CS-20261019-001', 1, 'In Progress', 1, NULL, 'Initial stock audit count.', '2026-10-20 11:32:08', NULL),
(2, 'COUNT-20261020133315', 1, 'Pending Approval', 1, NULL, NULL, '2026-10-20 11:33:15', NULL),
(3, 'COUNT-20261020133337', 1, 'Completed', 1, 1, NULL, '2026-10-20 11:33:37', '2026-10-20 19:34:29'),
(4, 'COUNT-20261020161247', 1, 'Pending Approval', 1, NULL, NULL, '2026-10-20 14:12:47', NULL),
(5, 'COUNT-20261020161306', 1, 'Completed', 1, 1, NULL, '2026-10-20 14:13:06', '2026-10-20 22:13:22'),
(6, 'COUNT-20261022054017', 1, 'Completed', 1, 1, NULL, '2026-10-22 03:40:17', '2026-10-22 11:41:45');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_count_session_items`
--

CREATE TABLE `tbl_count_session_items` (
  `item_id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `counted_qty` decimal(10,2) NOT NULL DEFAULT 0.00,
  `system_qty_snapshot` decimal(10,2) NOT NULL DEFAULT 0.00,
  `variance_qty` decimal(10,2) GENERATED ALWAYS AS (`counted_qty` - `system_qty_snapshot`) STORED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_count_session_items`
--

INSERT INTO `tbl_count_session_items` (`item_id`, `session_id`, `product_id`, `counted_qty`, `system_qty_snapshot`) VALUES
(1, 1, 1, 98.00, 100.00),
(2, 2, 1, 20.00, 100.00),
(3, 3, 1, 100.00, 100.00),
(4, 4, 1, 200.00, 55.00),
(5, 4, 2, 200.00, 45.00),
(7, 5, 1, 55.00, 55.00),
(8, 5, 2, 45.00, 45.00),
(9, 6, 1, 30.00, 55.00),
(10, 6, 2, 50.00, 45.00),
(11, 6, 4, 30.00, 30.00),
(12, 6, 6, 40.00, 40.00),
(13, 6, 7, 20.00, 10.00),
(14, 6, 8, 60.00, 134.00),
(15, 6, 10, 30.00, 15.00);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_customers`
--

CREATE TABLE `tbl_customers` (
  `customer_id` int(11) NOT NULL,
  `customer_name` varchar(150) NOT NULL,
  `tin` varchar(50) DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_customers`
--

INSERT INTO `tbl_customers` (`customer_id`, `customer_name`, `tin`, `contact_number`, `email`, `is_active`) VALUES
(1, 'Juan Dela Cruz', '123-456-789-000', '09181234567', 'juan@example.com', 1),
(2, 'MONGMONG', '456545767', '09979357515', 'chli.bolo.coc@phinmaed.com', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_goods_receipts`
--

CREATE TABLE `tbl_goods_receipts` (
  `id` int(11) NOT NULL,
  `receipt_no` varchar(50) NOT NULL,
  `po_id` int(11) NOT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `received_by` int(11) NOT NULL,
  `delivery_receipt_no` varchar(100) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_goods_receipts`
--

INSERT INTO `tbl_goods_receipts` (`id`, `receipt_no`, `po_id`, `supplier_id`, `received_by`, `delivery_receipt_no`, `note`, `created_at`) VALUES
(1, 'GR-20261019-001', 1, 1, 1, 'DR-10023', 'Received complete order in good condition.', '2026-10-20 11:32:09'),
(2, 'GR-20261020133534-738', 2, 1, 1, '', '', '2026-10-20 11:35:34'),
(3, 'GR-20261020140511-591', 3, 1, 1, '', '', '2026-10-20 12:05:11'),
(4, 'GR-20261020141834-938', 3, 1, 1, '', '', '2026-10-20 12:18:34'),
(5, 'GR-20261020144715-715', 4, 2, 1, '', '', '2026-10-20 12:47:15'),
(6, 'GR-20261020144745-320', 5, 2, 1, '', '', '2026-10-20 12:47:45'),
(7, 'GR-20261020144908-863', 6, 1, 1, '', '', '2026-10-20 12:49:08'),
(8, 'GR-20261020151627-880', 7, 2, 1, '', '', '2026-10-20 13:16:27'),
(9, 'GR-20261020152324-172', 8, 2, 1, '', '', '2026-10-20 13:23:24'),
(11, 'GR-20261021101643-640', 9, 3, 1, '', '', '2026-10-21 08:16:43'),
(12, 'GR-20261021102114-164', 10, 5, 1, '', '', '2026-10-21 08:21:14'),
(13, 'GR-20261021102154-332', 11, 5, 1, '', '', '2026-10-21 08:21:54'),
(14, 'GR-20261021104040-223', 12, 5, 1, '', '', '2026-10-21 08:40:40'),
(15, 'GR-20261021104229-703', 13, 2, 1, '', '', '2026-10-21 08:42:29'),
(16, 'GR-20261021104242-859', 13, 2, 1, '', '', '2026-10-21 08:42:42'),
(17, 'GR-20261021104340-325', 13, 2, 1, '', '', '2026-10-21 08:43:40'),
(18, 'GR-20261021104845-881', 12, 5, 1, '', '', '2026-10-21 08:48:45'),
(19, 'GR-20261021105529-959', 14, 1, 1, '', '', '2026-10-21 08:55:29'),
(20, 'GR-20261022052559-580', 15, 5, 1, '', '', '2026-10-22 03:25:59'),
(21, 'GR-20261022053223-531', 16, 3, 1, '', '', '2026-10-22 03:32:23'),
(22, 'GR-20261022053343-815', 16, 3, 1, '', '', '2026-10-22 03:33:43'),
(23, 'GR-20261028130734-674', 17, 5, 1, '', '', '2026-10-28 12:07:34'),
(24, 'GR-20261028131124-804', 18, 5, 1, '', '', '2026-10-28 12:11:25'),
(25, 'GR-20261028132215-491', 19, 5, 1, '', '', '2026-10-28 12:22:15');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_goods_receipt_items`
--

CREATE TABLE `tbl_goods_receipt_items` (
  `id` int(11) NOT NULL,
  `receipt_id` int(11) NOT NULL,
  `po_item_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `lot_number` varchar(50) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_goods_receipt_items`
--

INSERT INTO `tbl_goods_receipt_items` (`id`, `receipt_id`, `po_item_id`, `product_id`, `quantity`, `lot_number`, `expiry_date`) VALUES
(1, 1, 1, 1, 50.00, 'LOT-20261019-01', '2027-10-19'),
(2, 2, 2, 1, 5.00, '2', '2026-11-07'),
(3, 3, 3, 2, 50.00, '1', '2026-10-20'),
(4, 4, 3, 2, 50.00, '2', '2027-05-11'),
(5, 5, 4, 2, 10.00, '3', '2026-10-20'),
(6, 6, 5, 2, 10.00, '4', '2026-10-22'),
(8, 8, 7, 2, 5.00, '5', '2027-10-20'),
(9, 9, 8, 2, 5.00, '6', '2027-05-20'),
(10, 11, 9, 4, 50.00, '1', '2028-06-21'),
(11, 12, 10, 6, 20.00, '1', '2027-01-21'),
(12, 13, 11, 6, 20.00, '2', '2026-10-30'),
(13, 14, 12, 7, 20.00, '1', '2026-11-07'),
(14, 15, 13, 2, 5.00, '7', '2028-10-21'),
(15, 16, 13, 2, 5.00, '8', '2026-10-09'),
(16, 17, 13, 2, 5.00, '9', '2029-11-21'),
(17, 18, 12, 7, 10.00, '2', '2026-11-07'),
(18, 19, 14, 8, 140.00, '1', '2026-11-01'),
(19, 20, 15, 7, 5.00, '3', '2026-10-22'),
(20, 21, 16, 10, 15.00, '1', '2028-03-22'),
(21, 22, 16, 10, 5.00, '2', '2026-11-26'),
(22, 23, 17, 7, 20.00, '4', '2026-10-31'),
(23, 23, 18, 1, 50.00, '3', '2026-11-07'),
(24, 23, 19, 2, 50.00, '10', '2026-11-07'),
(25, 24, 20, 7, 20.00, '5', '2026-11-06'),
(26, 24, 21, 1, 30.00, '4', '2026-11-05'),
(27, 24, 22, 2, 30.00, '11', '2026-11-07'),
(28, 25, 23, 7, 20.00, '6', '2026-11-07'),
(29, 25, 24, 1, 50.00, '5', '2026-11-07'),
(30, 25, 25, 2, 50.00, '12', '2026-11-07');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_inventory`
--

CREATE TABLE `tbl_inventory` (
  `inventory_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 0,
  `non_sellable_qty` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_inventory`
--

INSERT INTO `tbl_inventory` (`inventory_id`, `branch_id`, `product_id`, `quantity`, `non_sellable_qty`) VALUES
(1, 1, 1, 70, 0),
(2, 1, 2, 0, 0),
(4, 1, 4, 30, 0),
(6, 1, 6, 40, 0),
(7, 1, 7, 0, 5),
(8, 1, 8, 60, 0),
(10, 1, 10, 30, 0),
(12, 2, 7, 40, 0),
(13, 2, 1, 10, 0),
(16, 3, 2, 80, 0);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_inventory_reasons`
--

CREATE TABLE `tbl_inventory_reasons` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `applies_to` enum('purchase_return','stock_return','adjustment','all') NOT NULL DEFAULT 'all',
  `direction` enum('increase','decrease','both') NOT NULL DEFAULT 'both',
  `requires_note` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_inventory_reasons`
--

INSERT INTO `tbl_inventory_reasons` (`id`, `name`, `applies_to`, `direction`, `requires_note`, `is_active`, `sort_order`, `created_at`) VALUES
(1, 'Damaged Goods', 'all', 'decrease', 0, 1, 1, '2026-10-20 11:32:08'),
(2, 'Expired / Past Expiry Date', 'all', 'decrease', 0, 1, 2, '2026-10-20 11:47:51'),
(3, 'Spoiled / Deteriorated', 'all', 'decrease', 0, 1, 3, '2026-10-20 11:47:51'),
(4, 'Defective Packaging', 'all', 'decrease', 0, 1, 4, '2026-10-20 11:47:51'),
(5, 'Customer Return (Damaged)', 'all', 'decrease', 1, 1, 5, '2026-10-20 11:47:51'),
(6, 'Physical Count Correction (Increase)', 'adjustment', 'increase', 0, 1, 10, '2026-10-20 11:47:51'),
(7, 'Physical Count Correction (Decrease)', 'adjustment', 'decrease', 0, 1, 11, '2026-10-20 11:47:51'),
(8, 'Theft / Shrinkage Loss', 'all', 'decrease', 1, 1, 12, '2026-10-20 11:47:51'),
(9, 'System / Data Entry Error', 'adjustment', 'both', 1, 1, 13, '2026-10-20 11:47:51'),
(10, 'Unrecorded Spoilage / Damage', 'all', 'decrease', 0, 1, 14, '2026-10-20 11:47:51'),
(11, 'Found / Uncounted Stock', 'adjustment', 'increase', 0, 1, 15, '2026-10-20 11:47:51'),
(12, 'Defective / Damaged from Supplier', 'purchase_return', 'decrease', 0, 1, 20, '2026-10-20 12:11:27'),
(13, 'Expired / Near Expiry on Arrival', 'purchase_return', 'decrease', 0, 1, 21, '2026-10-20 12:11:27'),
(14, 'Wrong Item / Variant Delivered', 'purchase_return', 'decrease', 0, 1, 22, '2026-10-20 12:11:27'),
(15, 'Excess Delivery / Over-shipment', 'purchase_return', 'decrease', 0, 1, 23, '2026-10-20 12:11:27'),
(16, 'Quality Specification Mismatch', 'purchase_return', 'decrease', 1, 1, 24, '2026-10-20 12:11:27'),
(17, 'Supplier Recall', 'purchase_return', 'decrease', 1, 1, 25, '2026-10-20 12:11:27');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_pack_conversions`
--

CREATE TABLE `tbl_pack_conversions` (
  `conversion_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `pack_uom_id` int(11) NOT NULL,
  `pieces_per_pack` decimal(10,2) NOT NULL DEFAULT 1.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_pack_conversions`
--

INSERT INTO `tbl_pack_conversions` (`conversion_id`, `product_id`, `pack_uom_id`, `pieces_per_pack`) VALUES
(1, 1, 1, 12.00),
(4, 2, 4, 1.00),
(8, 7, 3, 20.00),
(9, 6, 5, 20.00),
(10, 4, 5, 40.00),
(12, 8, 2, 6.00),
(13, 10, 3, 15.00);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_pos_transactions`
--

CREATE TABLE `tbl_pos_transactions` (
  `transaction_id` int(11) NOT NULL,
  `invoice_number` varchar(40) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `is_ar` tinyint(1) DEFAULT 0,
  `total_pax` int(11) DEFAULT 0,
  `discount_pax` int(11) DEFAULT 0,
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `subtotal_amount` decimal(10,2) NOT NULL,
  `tax_amount` decimal(10,2) DEFAULT 0.00,
  `total_amount` decimal(10,2) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_pos_transactions`
--

INSERT INTO `tbl_pos_transactions` (`transaction_id`, `invoice_number`, `branch_id`, `customer_id`, `is_ar`, `total_pax`, `discount_pax`, `discount_amount`, `subtotal_amount`, `tax_amount`, `total_amount`, `created_at`) VALUES
(1, 'INV-20261019-001', 1, 1, 0, 1, 0, 0.00, 50.00, 6.00, 56.00, '2026-10-20 19:32:08'),
(2, 'INV-1792500160010', 1, NULL, 0, 1, 0, 0.00, 1116.07, 133.93, 1250.00, '2026-10-20 20:42:47'),
(3, 'INV-1792500696773', 1, 1, 1, 1, 0, 0.00, 669.64, 80.36, 750.00, '2026-10-20 20:51:45'),
(4, 'INV-1792570686103', 1, NULL, 0, 1, 0, 0.00, 357.14, 42.86, 400.00, '2026-10-21 16:18:17'),
(5, 'INV-1792572049342', 1, NULL, 0, 1, 0, 0.00, 89.29, 10.71, 100.00, '2026-10-21 16:40:57'),
(6, 'INV-1792572994487', 1, NULL, 0, 1, 0, 0.00, 375.00, 45.00, 420.00, '2026-10-21 16:57:50'),
(7, 'INV-1792573079377', 1, 2, 1, 1, 0, 0.00, 375.00, 45.00, 420.00, '2026-10-21 16:58:42'),
(8, 'INV-1792639461844', 1, NULL, 0, 1, 0, 0.00, 267.86, 32.14, 300.00, '2026-10-22 11:24:38'),
(9, 'INV-1793189389937', 1, NULL, 0, 1, 0, 0.00, 48571.43, 5828.57, 54400.00, '2026-10-28 20:10:12');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_pos_transaction_items`
--

CREATE TABLE `tbl_pos_transaction_items` (
  `pos_item_id` int(11) NOT NULL,
  `transaction_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity_sold` int(11) NOT NULL CHECK (`quantity_sold` > 0),
  `unit_price` decimal(10,2) NOT NULL,
  `line_subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_pos_transaction_items`
--

INSERT INTO `tbl_pos_transaction_items` (`pos_item_id`, `transaction_id`, `product_id`, `quantity_sold`, `unit_price`, `line_subtotal`) VALUES
(1, 1, 1, 1, 50.00, 50.00),
(2, 2, 1, 25, 50.00, 1250.00),
(3, 3, 1, 15, 50.00, 750.00),
(4, 4, 4, 20, 20.00, 400.00),
(5, 5, 7, 10, 10.00, 100.00),
(6, 6, 8, 3, 140.00, 420.00),
(7, 7, 8, 3, 140.00, 420.00),
(8, 8, 7, 30, 10.00, 300.00),
(9, 9, 7, 40, 10.00, 400.00),
(10, 9, 1, 80, 50.00, 4000.00),
(11, 9, 2, 100, 500.00, 50000.00);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_po_items`
--

CREATE TABLE `tbl_po_items` (
  `po_item_id` int(11) NOT NULL,
  `po_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `qty_ordered` int(11) NOT NULL,
  `received_qty` decimal(10,2) NOT NULL DEFAULT 0.00,
  `returned_qty` decimal(10,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_po_items`
--

INSERT INTO `tbl_po_items` (`po_item_id`, `po_id`, `product_id`, `qty_ordered`, `received_qty`, `returned_qty`) VALUES
(1, 1, 1, 50, 50.00, 0.00),
(2, 2, 1, 5, 5.00, 0.00),
(3, 3, 2, 50, 50.00, 50.00),
(4, 4, 2, 10, 10.00, 0.00),
(5, 5, 2, 10, 10.00, 0.00),
(7, 7, 2, 5, 5.00, 0.00),
(8, 8, 2, 5, 5.00, 0.00),
(9, 9, 4, 50, 50.00, 0.00),
(10, 10, 6, 20, 20.00, 0.00),
(11, 11, 6, 20, 20.00, 0.00),
(12, 12, 7, 20, 20.00, 10.00),
(13, 13, 2, 10, 10.00, 5.00),
(14, 14, 8, 140, 140.00, 0.00),
(15, 15, 7, 20, 5.00, 0.00),
(16, 16, 10, 30, 15.00, 5.00),
(17, 17, 7, 20, 20.00, 0.00),
(18, 17, 1, 50, 50.00, 0.00),
(19, 17, 2, 50, 50.00, 0.00),
(20, 18, 7, 20, 20.00, 0.00),
(21, 18, 1, 50, 30.00, 0.00),
(22, 18, 2, 50, 30.00, 0.00),
(23, 19, 7, 20, 20.00, 0.00),
(24, 19, 1, 50, 50.00, 0.00),
(25, 19, 2, 50, 50.00, 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_products`
--

CREATE TABLE `tbl_products` (
  `product_id` int(11) NOT NULL,
  `sku` varchar(50) NOT NULL,
  `barcode` varchar(50) NOT NULL,
  `product_name` varchar(150) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `unit_of_measure` varchar(20) NOT NULL,
  `retail_price` decimal(10,2) NOT NULL CHECK (`retail_price` >= 0),
  `unit_cost` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax_rate` decimal(5,2) DEFAULT 0.00,
  `reorder_level` decimal(10,2) NOT NULL DEFAULT 10.00,
  `suggested_reorder_qty` decimal(10,2) NOT NULL DEFAULT 50.00,
  `track_expiry` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_products`
--

INSERT INTO `tbl_products` (`product_id`, `sku`, `barcode`, `product_name`, `category_id`, `unit_of_measure`, `retail_price`, `unit_cost`, `tax_rate`, `reorder_level`, `suggested_reorder_qty`, `track_expiry`, `is_active`) VALUES
(1, 'SKU-1001', '4800001', 'Coca-Cola 1L', 1, 'Piece', 50.00, 35.00, 12.00, 10.00, 50.00, 1, 1),
(2, 'SKU-1002', '123123', 'Mechanical Keyboard', 2, 'Piece', 500.00, 250.00, 12.00, 5.00, 50.00, 1, 1),
(4, 'SKU-1003', '1234561', 'Piattos', 3, 'Piece', 20.00, 15.00, 12.00, 10.00, 50.00, 1, 1),
(6, 'SKU-1004', '45512440', 'Sardinas ni Kulas', 5, 'Piece', 20.00, 15.00, 12.00, 15.00, 20.00, 1, 1),
(7, 'SKU-1005', '45042040', 'Apple', 6, 'Piece', 10.00, 5.00, 12.00, 10.00, 20.00, 1, 1),
(8, 'SKU-1009', '3456346', 'RH SUPER JUMONG', 1, 'Piece', 140.00, 100.00, 12.00, 20.00, 30.00, 1, 1),
(10, 'SKU-10010', '546213213', 'Nova', 3, 'Piece', 30.00, 20.00, 12.00, 10.00, 15.00, 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_purchase_orders`
--

CREATE TABLE `tbl_purchase_orders` (
  `po_id` int(11) NOT NULL,
  `po_number` varchar(40) NOT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Pending',
  `expected_date` date DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_purchase_orders`
--

INSERT INTO `tbl_purchase_orders` (`po_id`, `po_number`, `supplier_id`, `status`, `expected_date`, `created_at`) VALUES
(1, 'PO-20261019-001', 1, 'Closed', '2026-10-25', '2026-10-20 19:32:08'),
(2, 'PO-20261020-419', 1, 'Received', NULL, '2026-10-20 19:35:20'),
(3, 'PO-20261020-141', 1, 'Received', NULL, '2026-10-20 20:04:45'),
(4, 'PO-20261020-585', 2, 'Received', NULL, '2026-10-20 20:47:06'),
(5, 'PO-20261020-375', 2, 'Received', NULL, '2026-10-20 20:47:35'),
(6, 'PO-20261020-946', 1, 'Closed', NULL, '2026-10-20 20:48:53'),
(7, 'PO-20261020-374', 2, 'Received', NULL, '2026-10-20 21:16:11'),
(8, 'PO-20261020-609', 2, 'Received', NULL, '2026-10-20 21:22:59'),
(9, 'PO-20261021-984', 3, 'Received', NULL, '2026-10-21 16:16:31'),
(10, 'PO-20261021-439', 5, 'Received', NULL, '2026-10-21 16:20:57'),
(11, 'PO-20261021-162', 5, 'Received', '2026-10-22', '2026-10-21 16:21:38'),
(12, 'PO-20261021-204', 5, 'Received', NULL, '2026-10-21 16:40:30'),
(13, 'PO-20261021-539', 2, 'Received', NULL, '2026-10-21 16:41:58'),
(14, 'PO-20261021-345', 1, 'Received', '2026-10-31', '2026-10-21 16:55:11'),
(15, 'PO-20261022-922', 5, 'Partially Received', NULL, '2026-10-22 11:24:08'),
(16, 'PO-20261022-563', 3, 'Partially Received', '2026-10-29', '2026-10-22 11:31:53'),
(17, 'PO-20261028-283', 5, 'Received', NULL, '2026-10-28 20:07:02'),
(18, 'PO-20261028-316', 5, 'Partially Received', '2026-10-28', '2026-10-28 20:10:54'),
(19, 'PO-20261028-547', 5, 'Received', NULL, '2026-10-28 20:21:26');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_purchase_returns`
--

CREATE TABLE `tbl_purchase_returns` (
  `id` int(11) NOT NULL,
  `pr_no` varchar(50) NOT NULL,
  `po_id` int(11) NOT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `returned_by` int(11) NOT NULL,
  `reason_id` int(11) NOT NULL,
  `note` text DEFAULT NULL,
  `status` enum('Created','Picked Up','Credited','Replaced') NOT NULL DEFAULT 'Created',
  `credit_note_no` varchar(50) DEFAULT NULL,
  `return_photo_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_purchase_returns`
--

INSERT INTO `tbl_purchase_returns` (`id`, `pr_no`, `po_id`, `supplier_id`, `returned_by`, `reason_id`, `note`, `status`, `credit_note_no`, `return_photo_url`, `created_at`) VALUES
(1, 'PR-20261019-001', 1, 1, 1, 1, 'Damaged items during transit', 'Created', 'CN-9001', 'uploads/returns/pr1.jpg', '2026-10-20 11:32:09'),
(2, 'PR-20261020141747-342', 3, 1, 1, 12, '', 'Created', NULL, NULL, '2026-10-20 12:17:47'),
(3, 'PR-20261021104314-390', 13, 2, 1, 12, '', 'Created', NULL, NULL, '2026-10-21 08:43:14'),
(5, 'PR-20261021104835-346', 12, 5, 1, 1, '', 'Created', NULL, NULL, '2026-10-21 08:48:35'),
(6, 'PR-20261022053307-592', 16, 3, 1, 1, '', 'Created', NULL, NULL, '2026-10-22 03:33:07');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_purchase_return_items`
--

CREATE TABLE `tbl_purchase_return_items` (
  `id` int(11) NOT NULL,
  `pr_id` int(11) NOT NULL,
  `po_item_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `replacement_received_qty` decimal(10,2) NOT NULL DEFAULT 0.00,
  `replacement_expected` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_purchase_return_items`
--

INSERT INTO `tbl_purchase_return_items` (`id`, `pr_id`, `po_item_id`, `product_id`, `quantity`, `replacement_received_qty`, `replacement_expected`) VALUES
(1, 1, 1, 1, 5.00, 0.00, 1),
(2, 2, 3, 2, 50.00, 0.00, 1),
(3, 3, 13, 2, 5.00, 0.00, 1),
(4, 5, 12, 7, 10.00, 0.00, 1),
(5, 6, 16, 10, 5.00, 0.00, 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_stock_movements`
--

CREATE TABLE `tbl_stock_movements` (
  `id` bigint(20) NOT NULL,
  `product_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `movement_type` enum('OPENING_BALANCE','PO_RECEIPT','PURCHASE_RETURN','STOCK_RETURN','ADJUSTMENT_COUNT','ADJUSTMENT_MANUAL','DISPOSAL','RTV_SUPPLIER','POS_SALE') NOT NULL,
  `qty_change` decimal(10,2) NOT NULL,
  `qty_before` decimal(10,2) NOT NULL,
  `qty_after` decimal(10,2) NOT NULL,
  `reason_id` int(11) DEFAULT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_stock_movements`
--

INSERT INTO `tbl_stock_movements` (`id`, `product_id`, `branch_id`, `movement_type`, `qty_change`, `qty_before`, `qty_after`, `reason_id`, `reference_type`, `reference_id`, `note`, `user_id`, `created_at`) VALUES
(1, 1, 1, 'OPENING_BALANCE', 100.00, 0.00, 100.00, 1, 'INITIAL', 1, 'Opening stock entry.', 1, '2026-10-20 11:32:09'),
(2, 1, 1, 'RTV_SUPPLIER', -5.00, 5.00, 0.00, 1, 'RTV', 1, '', 1, '2026-10-20 11:35:20'),
(3, 1, 1, 'PO_RECEIPT', 5.00, 100.00, 105.00, NULL, 'GR', 2, '', 1, '2026-10-20 11:35:34'),
(4, 2, 1, 'PO_RECEIPT', 50.00, 0.00, 50.00, NULL, 'GR', 3, '', 1, '2026-10-20 12:05:11'),
(5, 2, 1, 'PURCHASE_RETURN', -50.00, 50.00, 0.00, 12, 'PR', 2, '', 1, '2026-10-20 12:17:47'),
(6, 2, 1, 'PO_RECEIPT', 50.00, 0.00, 50.00, NULL, 'GR', 4, '', 1, '2026-10-20 12:18:34'),
(7, 1, 1, 'ADJUSTMENT_COUNT', -100.00, 105.00, 5.00, 9, 'ADJUSTMENT', 1, ' [Approved by: Admin User (Admin)]', 1, '2026-10-20 12:30:55'),
(8, 1, 1, 'ADJUSTMENT_COUNT', 95.00, 5.00, 100.00, 6, 'ADJUSTMENT', 1, ' [Approved by: Admin User (Admin)]', 1, '2026-10-20 12:31:28'),
(9, 1, 1, 'ADJUSTMENT_COUNT', -5.00, 100.00, 95.00, 8, 'ADJUSTMENT', 1, ' [Approved by: Admin User (Admin)]', 1, '2026-10-20 12:38:16'),
(10, 1, 1, 'ADJUSTMENT_COUNT', 5.00, 95.00, 100.00, 6, 'ADJUSTMENT', 1, ' [Approved by: Admin User (Admin)]', 1, '2026-10-20 12:38:43'),
(11, 1, 1, 'POS_SALE', -25.00, 100.00, 75.00, NULL, 'POS', 2, 'POS Sale Invoice: INV-1792500160010', 1, '2026-10-20 12:42:47'),
(12, 2, 1, 'PO_RECEIPT', 10.00, 50.00, 60.00, NULL, 'GR', 5, '', 1, '2026-10-20 12:47:15'),
(13, 2, 1, 'PO_RECEIPT', 10.00, 60.00, 70.00, NULL, 'GR', 6, '', 1, '2026-10-20 12:47:46'),
(15, 1, 1, 'POS_SALE', -15.00, 75.00, 60.00, NULL, 'POS', 3, 'POS Sale Invoice: INV-1792500696773', 1, '2026-10-20 12:51:45'),
(16, 2, 1, 'STOCK_RETURN', -10.00, 70.00, 60.00, 2, 'EXPIRED_BATCH', 5, 'Near-expiry lot #3 transferred to non-sellable from Dashboard', 1, '2026-10-20 13:01:03'),
(17, 2, 1, 'STOCK_RETURN', 10.00, 0.00, 10.00, 2, 'EXPIRED_BATCH', 5, 'Transferred expired batch to non-sellable warehouse stock', 1, '2026-10-20 13:01:03'),
(19, 2, 1, 'STOCK_RETURN', -10.00, 60.00, 50.00, 3, 'STOCK_RETURN', 2, '', 1, '2026-10-20 13:11:51'),
(20, 2, 1, 'STOCK_RETURN', 10.00, 0.00, 10.00, 3, 'STOCK_RETURN', 2, 'Transferred to non-sellable warehouse stock', 1, '2026-10-20 13:11:51'),
(22, 2, 1, 'STOCK_RETURN', -5.00, 50.00, 45.00, 1, 'STOCK_RETURN', 2, '', 1, '2026-10-20 13:15:42'),
(23, 2, 1, 'STOCK_RETURN', 5.00, 0.00, 5.00, 1, 'STOCK_RETURN', 2, 'Transferred to non-sellable warehouse stock', 1, '2026-10-20 13:15:42'),
(24, 2, 1, 'RTV_SUPPLIER', -5.00, 5.00, 0.00, 1, 'RTV', 2, '', 1, '2026-10-20 13:16:11'),
(25, 2, 1, 'PO_RECEIPT', 5.00, 45.00, 50.00, NULL, 'GR', 8, '', 1, '2026-10-20 13:16:27'),
(26, 2, 1, 'STOCK_RETURN', -10.00, 50.00, 40.00, 1, 'STOCK_RETURN', 2, '', 1, '2026-10-20 13:22:18'),
(27, 2, 1, 'STOCK_RETURN', 10.00, 0.00, 10.00, 1, 'STOCK_RETURN', 2, 'Transferred to non-sellable warehouse stock', 1, '2026-10-20 13:22:18'),
(28, 2, 1, 'DISPOSAL', -5.00, 10.00, 5.00, 2, 'DISPOSAL', 2, '', 1, '2026-10-20 13:22:29'),
(29, 2, 1, 'RTV_SUPPLIER', -5.00, 5.00, 0.00, 5, 'RTV', 2, '', 1, '2026-10-20 13:22:59'),
(30, 2, 1, 'PO_RECEIPT', 5.00, 40.00, 45.00, NULL, 'GR', 9, '', 1, '2026-10-20 13:23:24'),
(31, 1, 1, 'STOCK_RETURN', -5.00, 60.00, 55.00, 1, 'STOCK_RETURN', 1, '', 1, '2026-10-20 13:31:14'),
(32, 1, 1, 'STOCK_RETURN', 5.00, 0.00, 5.00, 1, 'STOCK_RETURN', 1, 'Transferred to non-sellable warehouse stock', 1, '2026-10-20 13:31:14'),
(33, 1, 1, 'DISPOSAL', -5.00, 5.00, 0.00, 1, 'DISPOSAL', 1, '', 1, '2026-10-20 13:31:37'),
(34, 4, 1, 'PO_RECEIPT', 50.00, 0.00, 50.00, NULL, 'GR', 11, '', 1, '2026-10-21 08:16:43'),
(35, 4, 1, 'POS_SALE', -20.00, 50.00, 30.00, NULL, 'POS', 4, 'POS Sale Invoice: INV-1792570686103', 1, '2026-10-21 08:18:17'),
(36, 6, 1, 'PO_RECEIPT', 20.00, 0.00, 20.00, NULL, 'GR', 12, '', 1, '2026-10-21 08:21:14'),
(37, 6, 1, 'PO_RECEIPT', 20.00, 20.00, 40.00, NULL, 'GR', 13, '', 1, '2026-10-21 08:21:54'),
(38, 7, 1, 'PO_RECEIPT', 20.00, 0.00, 20.00, NULL, 'GR', 14, '', 1, '2026-10-21 08:40:40'),
(39, 7, 1, 'POS_SALE', -10.00, 20.00, 10.00, NULL, 'POS', 5, 'POS Sale Invoice: INV-1792572049342', 1, '2026-10-21 08:40:57'),
(40, 2, 1, 'STOCK_RETURN', -10.00, 45.00, 35.00, 2, 'EXPIRED_BATCH', 6, 'Near-expiry lot #4 transferred to non-sellable from Dashboard', 1, '2026-10-21 08:41:14'),
(41, 2, 1, 'STOCK_RETURN', 10.00, 0.00, 10.00, 2, 'EXPIRED_BATCH', 6, 'Transferred expired batch to non-sellable warehouse stock', 1, '2026-10-21 08:41:14'),
(42, 2, 1, 'RTV_SUPPLIER', -10.00, 10.00, 0.00, 5, 'RTV', 2, '', 1, '2026-10-21 08:41:58'),
(43, 2, 1, 'PO_RECEIPT', 5.00, 35.00, 40.00, NULL, 'GR', 15, '', 1, '2026-10-21 08:42:29'),
(44, 2, 1, 'PO_RECEIPT', 5.00, 40.00, 45.00, NULL, 'GR', 16, '', 1, '2026-10-21 08:42:42'),
(45, 2, 1, 'STOCK_RETURN', -5.00, 45.00, 40.00, 2, 'EXPIRED_BATCH', 15, 'Near-expiry lot #8 transferred to non-sellable from Dashboard', 1, '2026-10-21 08:43:00'),
(46, 2, 1, 'STOCK_RETURN', 5.00, 0.00, 5.00, 2, 'EXPIRED_BATCH', 15, 'Transferred expired batch to non-sellable warehouse stock', 1, '2026-10-21 08:43:00'),
(47, 2, 1, 'PURCHASE_RETURN', -5.00, 5.00, 0.00, 12, 'PR', 3, '', 1, '2026-10-21 08:43:14'),
(48, 2, 1, 'PO_RECEIPT', 5.00, 40.00, 45.00, NULL, 'GR', 17, '', 1, '2026-10-21 08:43:40'),
(49, 7, 1, 'ADJUSTMENT_COUNT', 30.00, 10.00, 40.00, 6, 'ADJUSTMENT', 7, ' [Approved by: Admin User (Admin)]', 1, '2026-10-21 08:44:19'),
(50, 7, 1, 'PURCHASE_RETURN', -10.00, 40.00, 30.00, 1, 'PR', 5, '', 1, '2026-10-21 08:48:35'),
(51, 7, 1, 'PO_RECEIPT', 10.00, 30.00, 40.00, NULL, 'GR', 18, '', 1, '2026-10-21 08:48:45'),
(52, 8, 1, 'PO_RECEIPT', 140.00, 0.00, 140.00, NULL, 'GR', 19, '', 1, '2026-10-21 08:55:29'),
(53, 8, 1, 'POS_SALE', -3.00, 140.00, 137.00, NULL, 'POS', 6, 'POS Sale Invoice: INV-1792572994487', 1, '2026-10-21 08:57:50'),
(54, 8, 1, 'POS_SALE', -3.00, 137.00, 134.00, NULL, 'POS', 7, 'POS Sale Invoice: INV-1792573079377', 1, '2026-10-21 08:58:42'),
(55, 7, 1, 'POS_SALE', -30.00, 40.00, 10.00, NULL, 'POS', 8, 'POS Sale Invoice: INV-1792639461844', 1, '2026-10-22 03:24:38'),
(56, 7, 1, 'PO_RECEIPT', 5.00, 10.00, 15.00, NULL, 'GR', 20, '', 1, '2026-10-22 03:25:59'),
(57, 7, 1, 'STOCK_RETURN', -5.00, 15.00, 10.00, 2, 'EXPIRED_BATCH', 19, 'Near-expiry lot #3 transferred to non-sellable from Dashboard', 1, '2026-10-22 03:26:10'),
(58, 7, 1, 'STOCK_RETURN', 5.00, 0.00, 5.00, 2, 'EXPIRED_BATCH', 19, 'Transferred expired batch to non-sellable warehouse stock', 1, '2026-10-22 03:26:10'),
(59, 10, 1, 'PO_RECEIPT', 15.00, 0.00, 15.00, NULL, 'GR', 21, '', 1, '2026-10-22 03:32:23'),
(60, 10, 1, 'PURCHASE_RETURN', -5.00, 15.00, 10.00, 1, 'PR', 6, '', 1, '2026-10-22 03:33:08'),
(61, 10, 1, 'PO_RECEIPT', 5.00, 10.00, 15.00, NULL, 'GR', 22, '', 1, '2026-10-22 03:33:43'),
(62, 1, 1, '', -25.00, 55.00, 30.00, NULL, 'COUNT_SESSION', 6, 'Cycle Count Approved by Admin User (Admin)', 1, '2026-10-22 03:41:45'),
(63, 2, 1, '', 5.00, 45.00, 50.00, NULL, 'COUNT_SESSION', 6, 'Cycle Count Approved by Admin User (Admin)', 1, '2026-10-22 03:41:45'),
(64, 7, 1, '', 10.00, 10.00, 20.00, NULL, 'COUNT_SESSION', 6, 'Cycle Count Approved by Admin User (Admin)', 1, '2026-10-22 03:41:45'),
(65, 8, 1, '', -74.00, 134.00, 60.00, NULL, 'COUNT_SESSION', 6, 'Cycle Count Approved by Admin User (Admin)', 1, '2026-10-22 03:41:45'),
(66, 10, 1, '', 15.00, 15.00, 30.00, NULL, 'COUNT_SESSION', 6, 'Cycle Count Approved by Admin User (Admin)', 1, '2026-10-22 03:41:45'),
(67, 7, 1, 'PO_RECEIPT', 20.00, 20.00, 40.00, NULL, 'GR', 23, '', 1, '2026-10-28 12:07:34'),
(68, 1, 1, 'PO_RECEIPT', 50.00, 30.00, 80.00, NULL, 'GR', 23, '', 1, '2026-10-28 12:07:34'),
(69, 2, 1, 'PO_RECEIPT', 50.00, 50.00, 100.00, NULL, 'GR', 23, '', 1, '2026-10-28 12:07:34'),
(70, 7, 1, 'POS_SALE', -40.00, 40.00, 0.00, NULL, 'POS', 9, 'POS Sale Invoice: INV-1793189389937', 1, '2026-10-28 12:10:12'),
(71, 1, 1, 'POS_SALE', -80.00, 80.00, 0.00, NULL, 'POS', 9, 'POS Sale Invoice: INV-1793189389937', 1, '2026-10-28 12:10:12'),
(72, 2, 1, 'POS_SALE', -100.00, 100.00, 0.00, NULL, 'POS', 9, 'POS Sale Invoice: INV-1793189389937', 1, '2026-10-28 12:10:12'),
(73, 7, 1, 'PO_RECEIPT', 20.00, 0.00, 20.00, NULL, 'GR', 24, '', 1, '2026-10-28 12:11:25'),
(74, 1, 1, 'PO_RECEIPT', 30.00, 0.00, 30.00, NULL, 'GR', 24, '', 1, '2026-10-28 12:11:25'),
(75, 2, 1, 'PO_RECEIPT', 30.00, 0.00, 30.00, NULL, 'GR', 24, '', 1, '2026-10-28 12:11:25'),
(76, 7, 1, 'PO_RECEIPT', 20.00, 20.00, 40.00, NULL, 'GR', 25, '', 1, '2026-10-28 12:22:15'),
(77, 1, 1, 'PO_RECEIPT', 50.00, 30.00, 80.00, NULL, 'GR', 25, '', 1, '2026-10-28 12:22:15'),
(78, 2, 1, 'PO_RECEIPT', 50.00, 30.00, 80.00, NULL, 'GR', 25, '', 1, '2026-10-28 12:22:15'),
(79, 7, 1, 'STOCK_RETURN', -30.00, 40.00, 10.00, NULL, 'TRANSFER_OUT', 1, 'Stock Release to Store (TR #TR-20261028-520)', 1, '2026-10-28 13:06:23'),
(80, 7, 2, 'PO_RECEIPT', 30.00, 0.00, 30.00, NULL, 'TRANSFER_IN', 1, 'Stock Received from Warehouse (TR #TR-20261028-520)', 1, '2026-10-28 13:06:23'),
(81, 1, 1, 'STOCK_RETURN', -10.00, 80.00, 70.00, NULL, 'TRANSFER_OUT', 1, 'Stock Release to Store (TR #TR-20261028-520)', 1, '2026-10-28 13:06:23'),
(82, 1, 2, 'PO_RECEIPT', 10.00, 0.00, 10.00, NULL, 'TRANSFER_IN', 1, 'Stock Received from Warehouse (TR #TR-20261028-520)', 1, '2026-10-28 13:06:23'),
(83, 7, 1, 'STOCK_RETURN', -10.00, 10.00, 0.00, NULL, 'TRANSFER_OUT', 3, 'Stock Release to Store (TR #TR-20261028-310)', 1, '2026-10-28 13:07:11'),
(84, 7, 2, 'PO_RECEIPT', 10.00, 30.00, 40.00, NULL, 'TRANSFER_IN', 3, 'Stock Received from Warehouse (TR #TR-20261028-310)', 1, '2026-10-28 13:07:11'),
(85, 2, 1, 'STOCK_RETURN', -80.00, 80.00, 0.00, NULL, 'TRANSFER_OUT', 4, 'Stock Release to Store (TR #TR-20261028-235)', 1, '2026-10-28 13:32:04'),
(86, 2, 3, 'PO_RECEIPT', 80.00, 0.00, 80.00, NULL, 'TRANSFER_IN', 4, 'Stock Received from Warehouse (TR #TR-20261028-235)', 1, '2026-10-28 13:32:04');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_store_returns`
--

CREATE TABLE `tbl_store_returns` (
  `return_id` int(11) NOT NULL,
  `return_no` varchar(50) NOT NULL,
  `from_branch_id` int(11) NOT NULL,
  `to_branch_id` int(11) NOT NULL DEFAULT 1,
  `reason_id` int(11) NOT NULL,
  `status` enum('Completed','Cancelled') NOT NULL DEFAULT 'Completed',
  `note` text DEFAULT NULL,
  `created_by` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_store_return_items`
--

CREATE TABLE `tbl_store_return_items` (
  `item_id` int(11) NOT NULL,
  `return_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_suppliers`
--

CREATE TABLE `tbl_suppliers` (
  `supplier_id` int(11) NOT NULL,
  `supplier_code` varchar(20) NOT NULL,
  `company_name` varchar(150) NOT NULL,
  `contact_name` varchar(100) NOT NULL,
  `contact_phone` varchar(20) NOT NULL,
  `specialized_product` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_suppliers`
--

INSERT INTO `tbl_suppliers` (`supplier_id`, `supplier_code`, `company_name`, `contact_name`, `contact_phone`, `specialized_product`, `is_active`, `created_at`) VALUES
(1, 'SUP-001', 'Universal Beverages Inc.', 'John Doe', '09171234567', 'Beverages', 1, '2026-10-20 19:32:08'),
(2, 'SUP-002', 'Kulas Store', 'Sam / 09061673304', '', 'Technologies', 1, '2026-10-20 19:49:16'),
(3, 'SUP-003', 'Jaymar Corp', 'Jaymar / 09056578153', '', 'Snacks and Breverages', 1, '2026-10-21 15:19:50'),
(5, 'SUP-069', 'Chan2 Corp.', 'Sam / 09088184444', '', NULL, 1, '2026-10-21 16:17:54'),
(8, 'SUP-012', 'crispyking', '09061344940', '', NULL, 1, '2026-10-22 12:00:18');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_supplier_categories`
--

CREATE TABLE `tbl_supplier_categories` (
  `supplier_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_supplier_categories`
--

INSERT INTO `tbl_supplier_categories` (`supplier_id`, `category_id`) VALUES
(1, 1),
(2, 2),
(3, 3),
(5, 1),
(5, 2),
(5, 3),
(5, 5),
(5, 6),
(5, 7),
(8, 5);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_system_logs`
--

CREATE TABLE `tbl_system_logs` (
  `log_id` int(11) NOT NULL,
  `action_type` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_system_logs`
--

INSERT INTO `tbl_system_logs` (`log_id`, `action_type`, `description`, `created_at`) VALUES
(1, 'SYSTEM_INIT', 'System database initialized with seed records.', '2026-10-20 19:32:08'),
(2, 'CATEGORY_ADD', 'Added category: Mechanical Keyboard', '2026-10-20 19:49:43'),
(3, 'AR_PAYMENT', 'Settled AR Account Payment for AR Record ID: 1', '2026-10-20 20:51:21'),
(4, 'AR_PAYMENT', 'Settled AR Account Payment for AR Record ID: 2', '2026-10-20 20:51:50'),
(5, 'PRODUCT_ARCHIVE', 'Archived product ID ', '2026-10-20 21:54:46'),
(6, 'PRODUCT_ARCHIVE', 'Archived product ID ', '2026-10-20 21:54:50'),
(7, 'PRODUCT_ARCHIVE', 'Archived product ID ', '2026-10-20 21:55:18'),
(8, 'PO_CANCEL', 'Cancelled Purchase Order ID: 1', '2026-10-20 22:22:13'),
(9, 'PO_CANCEL', 'Cancelled Purchase Order ID: 6', '2026-10-21 16:18:43'),
(10, 'CUSTOMER_CREATE', 'Registered AR Customer [ MONGMONG ] TIN: 456545767 Contact: 09979357515', '2026-10-21 16:58:31'),
(11, 'AR_PAYMENT', 'Settled AR Account Payment for AR Record ID: 3', '2026-10-21 16:58:53'),
(12, 'PO_CANCEL', 'Cancelled Purchase Order ID: 16', '2026-10-22 11:32:52');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_system_settings`
--

CREATE TABLE `tbl_system_settings` (
  `setting_key` varchar(50) NOT NULL,
  `setting_value` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_system_settings`
--

INSERT INTO `tbl_system_settings` (`setting_key`, `setting_value`) VALUES
('company_name', 'ApexLogix Enterprise');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_transfers`
--

CREATE TABLE `tbl_transfers` (
  `transfer_id` int(11) NOT NULL,
  `transfer_no` varchar(50) NOT NULL,
  `from_branch_id` int(11) NOT NULL,
  `to_branch_id` int(11) NOT NULL,
  `status` enum('Pending','Released','Cancelled') NOT NULL DEFAULT 'Pending',
  `note` text DEFAULT NULL,
  `created_by` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `released_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_transfers`
--

INSERT INTO `tbl_transfers` (`transfer_id`, `transfer_no`, `from_branch_id`, `to_branch_id`, `status`, `note`, `created_by`, `created_at`, `released_at`) VALUES
(1, 'TR-20261028-520', 1, 2, 'Released', '', 1, '2026-10-28 13:06:12', '2026-10-28 21:06:23'),
(2, 'TR-20261028-599', 1, 2, 'Cancelled', '', 1, '2026-10-28 13:06:51', NULL),
(3, 'TR-20261028-310', 1, 2, 'Released', '', 1, '2026-10-28 13:07:08', '2026-10-28 21:07:11'),
(4, 'TR-20261028-235', 1, 3, 'Released', 'pakyo', 1, '2026-10-28 13:32:01', '2026-10-28 21:32:04');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_transfer_items`
--

CREATE TABLE `tbl_transfer_items` (
  `item_id` int(11) NOT NULL,
  `transfer_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_transfer_items`
--

INSERT INTO `tbl_transfer_items` (`item_id`, `transfer_id`, `product_id`, `quantity`) VALUES
(1, 1, 7, 30.00),
(2, 1, 1, 10.00),
(3, 2, 7, 20.00),
(4, 3, 7, 10.00),
(5, 4, 2, 80.00);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_uoms`
--

CREATE TABLE `tbl_uoms` (
  `uom_id` int(11) NOT NULL,
  `uom_code` varchar(20) NOT NULL,
  `uom_name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_uoms`
--

INSERT INTO `tbl_uoms` (`uom_id`, `uom_code`, `uom_name`) VALUES
(1, 'PCS', 'Pieces'),
(2, 'CASE', 'Case'),
(3, 'PACK', 'Pack'),
(4, 'BOX', 'Box'),
(5, 'BNDL', 'Bundle');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_users`
--

CREATE TABLE `tbl_users` (
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `role` enum('Admin','Manager') NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_users`
--

INSERT INTO `tbl_users` (`user_id`, `username`, `password_hash`, `full_name`, `role`, `is_active`, `created_at`) VALUES
(1, 'admin', 'Gwapo', 'Admin User', 'Admin', 1, '2026-10-20 19:32:08');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `tbl_accounts_receivable`
--
ALTER TABLE `tbl_accounts_receivable`
  ADD PRIMARY KEY (`ar_id`);

--
-- Indexes for table `tbl_audit_logs`
--
ALTER TABLE `tbl_audit_logs`
  ADD PRIMARY KEY (`log_id`);

--
-- Indexes for table `tbl_batches`
--
ALTER TABLE `tbl_batches`
  ADD PRIMARY KEY (`batch_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `branch_id` (`branch_id`);

--
-- Indexes for table `tbl_branches`
--
ALTER TABLE `tbl_branches`
  ADD PRIMARY KEY (`branch_id`),
  ADD UNIQUE KEY `branch_code` (`branch_code`);

--
-- Indexes for table `tbl_categories`
--
ALTER TABLE `tbl_categories`
  ADD PRIMARY KEY (`category_id`);

--
-- Indexes for table `tbl_count_sessions`
--
ALTER TABLE `tbl_count_sessions`
  ADD PRIMARY KEY (`session_id`),
  ADD UNIQUE KEY `session_no` (`session_no`);

--
-- Indexes for table `tbl_count_session_items`
--
ALTER TABLE `tbl_count_session_items`
  ADD PRIMARY KEY (`item_id`),
  ADD KEY `session_id` (`session_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `tbl_customers`
--
ALTER TABLE `tbl_customers`
  ADD PRIMARY KEY (`customer_id`);

--
-- Indexes for table `tbl_goods_receipts`
--
ALTER TABLE `tbl_goods_receipts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `receipt_no` (`receipt_no`),
  ADD KEY `fk_gr_supplier` (`supplier_id`),
  ADD KEY `po_id` (`po_id`);

--
-- Indexes for table `tbl_goods_receipt_items`
--
ALTER TABLE `tbl_goods_receipt_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `receipt_id` (`receipt_id`),
  ADD KEY `fk_gri_prod` (`product_id`);

--
-- Indexes for table `tbl_inventory`
--
ALTER TABLE `tbl_inventory`
  ADD PRIMARY KEY (`inventory_id`),
  ADD UNIQUE KEY `uq_branch_product` (`branch_id`,`product_id`),
  ADD KEY `branch_id` (`branch_id`),
  ADD KEY `idx_inventory_product` (`product_id`);

--
-- Indexes for table `tbl_inventory_reasons`
--
ALTER TABLE `tbl_inventory_reasons`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_pack_conversions`
--
ALTER TABLE `tbl_pack_conversions`
  ADD PRIMARY KEY (`conversion_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `pack_uom_id` (`pack_uom_id`);

--
-- Indexes for table `tbl_pos_transactions`
--
ALTER TABLE `tbl_pos_transactions`
  ADD PRIMARY KEY (`transaction_id`),
  ADD UNIQUE KEY `invoice_number` (`invoice_number`),
  ADD KEY `branch_id` (`branch_id`);

--
-- Indexes for table `tbl_pos_transaction_items`
--
ALTER TABLE `tbl_pos_transaction_items`
  ADD PRIMARY KEY (`pos_item_id`),
  ADD KEY `transaction_id` (`transaction_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `tbl_po_items`
--
ALTER TABLE `tbl_po_items`
  ADD PRIMARY KEY (`po_item_id`),
  ADD KEY `fk_po_item_prod` (`product_id`),
  ADD KEY `po_id` (`po_id`);

--
-- Indexes for table `tbl_products`
--
ALTER TABLE `tbl_products`
  ADD PRIMARY KEY (`product_id`),
  ADD UNIQUE KEY `sku` (`sku`),
  ADD UNIQUE KEY `barcode` (`barcode`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `tbl_purchase_orders`
--
ALTER TABLE `tbl_purchase_orders`
  ADD PRIMARY KEY (`po_id`),
  ADD KEY `fk_po_supplier` (`supplier_id`);

--
-- Indexes for table `tbl_purchase_returns`
--
ALTER TABLE `tbl_purchase_returns`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `pr_no` (`pr_no`),
  ADD KEY `fk_pr_supplier` (`supplier_id`),
  ADD KEY `po_id` (`po_id`);

--
-- Indexes for table `tbl_purchase_return_items`
--
ALTER TABLE `tbl_purchase_return_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pr_id` (`pr_id`),
  ADD KEY `fk_pri_prod` (`product_id`);

--
-- Indexes for table `tbl_stock_movements`
--
ALTER TABLE `tbl_stock_movements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reason_id` (`reason_id`),
  ADD KEY `idx_stock_movements_prod_branch` (`product_id`,`branch_id`),
  ADD KEY `idx_stock_movements_ref` (`reference_type`,`reference_id`),
  ADD KEY `created_at` (`created_at`);

--
-- Indexes for table `tbl_store_returns`
--
ALTER TABLE `tbl_store_returns`
  ADD PRIMARY KEY (`return_id`),
  ADD UNIQUE KEY `return_no` (`return_no`);

--
-- Indexes for table `tbl_store_return_items`
--
ALTER TABLE `tbl_store_return_items`
  ADD PRIMARY KEY (`item_id`),
  ADD KEY `return_id` (`return_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `tbl_suppliers`
--
ALTER TABLE `tbl_suppliers`
  ADD PRIMARY KEY (`supplier_id`),
  ADD UNIQUE KEY `supplier_code` (`supplier_code`);

--
-- Indexes for table `tbl_supplier_categories`
--
ALTER TABLE `tbl_supplier_categories`
  ADD PRIMARY KEY (`supplier_id`,`category_id`),
  ADD KEY `fk_sc_category` (`category_id`);

--
-- Indexes for table `tbl_system_logs`
--
ALTER TABLE `tbl_system_logs`
  ADD PRIMARY KEY (`log_id`);

--
-- Indexes for table `tbl_system_settings`
--
ALTER TABLE `tbl_system_settings`
  ADD PRIMARY KEY (`setting_key`);

--
-- Indexes for table `tbl_transfers`
--
ALTER TABLE `tbl_transfers`
  ADD PRIMARY KEY (`transfer_id`),
  ADD UNIQUE KEY `transfer_no` (`transfer_no`);

--
-- Indexes for table `tbl_transfer_items`
--
ALTER TABLE `tbl_transfer_items`
  ADD PRIMARY KEY (`item_id`),
  ADD KEY `transfer_id` (`transfer_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `tbl_uoms`
--
ALTER TABLE `tbl_uoms`
  ADD PRIMARY KEY (`uom_id`),
  ADD UNIQUE KEY `uom_code` (`uom_code`);

--
-- Indexes for table `tbl_users`
--
ALTER TABLE `tbl_users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `tbl_accounts_receivable`
--
ALTER TABLE `tbl_accounts_receivable`
  MODIFY `ar_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tbl_audit_logs`
--
ALTER TABLE `tbl_audit_logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tbl_batches`
--
ALTER TABLE `tbl_batches`
  MODIFY `batch_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `tbl_branches`
--
ALTER TABLE `tbl_branches`
  MODIFY `branch_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tbl_categories`
--
ALTER TABLE `tbl_categories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `tbl_count_sessions`
--
ALTER TABLE `tbl_count_sessions`
  MODIFY `session_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `tbl_count_session_items`
--
ALTER TABLE `tbl_count_session_items`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `tbl_customers`
--
ALTER TABLE `tbl_customers`
  MODIFY `customer_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `tbl_goods_receipts`
--
ALTER TABLE `tbl_goods_receipts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `tbl_goods_receipt_items`
--
ALTER TABLE `tbl_goods_receipt_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `tbl_inventory`
--
ALTER TABLE `tbl_inventory`
  MODIFY `inventory_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `tbl_inventory_reasons`
--
ALTER TABLE `tbl_inventory_reasons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `tbl_pack_conversions`
--
ALTER TABLE `tbl_pack_conversions`
  MODIFY `conversion_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `tbl_pos_transactions`
--
ALTER TABLE `tbl_pos_transactions`
  MODIFY `transaction_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `tbl_pos_transaction_items`
--
ALTER TABLE `tbl_pos_transaction_items`
  MODIFY `pos_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `tbl_po_items`
--
ALTER TABLE `tbl_po_items`
  MODIFY `po_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `tbl_products`
--
ALTER TABLE `tbl_products`
  MODIFY `product_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `tbl_purchase_orders`
--
ALTER TABLE `tbl_purchase_orders`
  MODIFY `po_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `tbl_purchase_returns`
--
ALTER TABLE `tbl_purchase_returns`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `tbl_purchase_return_items`
--
ALTER TABLE `tbl_purchase_return_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `tbl_stock_movements`
--
ALTER TABLE `tbl_stock_movements`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=87;

--
-- AUTO_INCREMENT for table `tbl_store_returns`
--
ALTER TABLE `tbl_store_returns`
  MODIFY `return_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_store_return_items`
--
ALTER TABLE `tbl_store_return_items`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_suppliers`
--
ALTER TABLE `tbl_suppliers`
  MODIFY `supplier_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `tbl_system_logs`
--
ALTER TABLE `tbl_system_logs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `tbl_transfers`
--
ALTER TABLE `tbl_transfers`
  MODIFY `transfer_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tbl_transfer_items`
--
ALTER TABLE `tbl_transfer_items`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `tbl_uoms`
--
ALTER TABLE `tbl_uoms`
  MODIFY `uom_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `tbl_users`
--
ALTER TABLE `tbl_users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `tbl_batches`
--
ALTER TABLE `tbl_batches`
  ADD CONSTRAINT `fk_batch_branch` FOREIGN KEY (`branch_id`) REFERENCES `tbl_branches` (`branch_id`),
  ADD CONSTRAINT `fk_batch_product` FOREIGN KEY (`product_id`) REFERENCES `tbl_products` (`product_id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_count_session_items`
--
ALTER TABLE `tbl_count_session_items`
  ADD CONSTRAINT `tbl_count_session_items_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `tbl_count_sessions` (`session_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_count_session_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `tbl_products` (`product_id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_goods_receipts`
--
ALTER TABLE `tbl_goods_receipts`
  ADD CONSTRAINT `fk_gr_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `tbl_suppliers` (`supplier_id`) ON DELETE SET NULL;

--
-- Constraints for table `tbl_goods_receipt_items`
--
ALTER TABLE `tbl_goods_receipt_items`
  ADD CONSTRAINT `fk_gri_prod` FOREIGN KEY (`product_id`) REFERENCES `tbl_products` (`product_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_goods_receipt_items_ibfk_1` FOREIGN KEY (`receipt_id`) REFERENCES `tbl_goods_receipts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_inventory`
--
ALTER TABLE `tbl_inventory`
  ADD CONSTRAINT `tbl_inventory_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `tbl_branches` (`branch_id`),
  ADD CONSTRAINT `tbl_inventory_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `tbl_products` (`product_id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_pack_conversions`
--
ALTER TABLE `tbl_pack_conversions`
  ADD CONSTRAINT `tbl_pack_conversions_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `tbl_products` (`product_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_pack_conversions_ibfk_2` FOREIGN KEY (`pack_uom_id`) REFERENCES `tbl_uoms` (`uom_id`);

--
-- Constraints for table `tbl_pos_transactions`
--
ALTER TABLE `tbl_pos_transactions`
  ADD CONSTRAINT `tbl_pos_transactions_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `tbl_branches` (`branch_id`);

--
-- Constraints for table `tbl_pos_transaction_items`
--
ALTER TABLE `tbl_pos_transaction_items`
  ADD CONSTRAINT `tbl_pos_transaction_items_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `tbl_pos_transactions` (`transaction_id`),
  ADD CONSTRAINT `tbl_pos_transaction_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `tbl_products` (`product_id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_po_items`
--
ALTER TABLE `tbl_po_items`
  ADD CONSTRAINT `fk_po_item_prod` FOREIGN KEY (`product_id`) REFERENCES `tbl_products` (`product_id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_products`
--
ALTER TABLE `tbl_products`
  ADD CONSTRAINT `tbl_products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `tbl_categories` (`category_id`) ON DELETE SET NULL;

--
-- Constraints for table `tbl_purchase_orders`
--
ALTER TABLE `tbl_purchase_orders`
  ADD CONSTRAINT `fk_po_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `tbl_suppliers` (`supplier_id`) ON DELETE SET NULL;

--
-- Constraints for table `tbl_purchase_returns`
--
ALTER TABLE `tbl_purchase_returns`
  ADD CONSTRAINT `fk_pr_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `tbl_suppliers` (`supplier_id`) ON DELETE SET NULL;

--
-- Constraints for table `tbl_purchase_return_items`
--
ALTER TABLE `tbl_purchase_return_items`
  ADD CONSTRAINT `fk_pri_prod` FOREIGN KEY (`product_id`) REFERENCES `tbl_products` (`product_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_purchase_return_items_ibfk_1` FOREIGN KEY (`pr_id`) REFERENCES `tbl_purchase_returns` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_stock_movements`
--
ALTER TABLE `tbl_stock_movements`
  ADD CONSTRAINT `fk_sm_product` FOREIGN KEY (`product_id`) REFERENCES `tbl_products` (`product_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_stock_movements_ibfk_1` FOREIGN KEY (`reason_id`) REFERENCES `tbl_inventory_reasons` (`id`);

--
-- Constraints for table `tbl_supplier_categories`
--
ALTER TABLE `tbl_supplier_categories`
  ADD CONSTRAINT `fk_sc_category` FOREIGN KEY (`category_id`) REFERENCES `tbl_categories` (`category_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sc_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `tbl_suppliers` (`supplier_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
