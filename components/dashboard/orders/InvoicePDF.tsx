"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Path,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import type { OrderDetailResponse } from "@/lib/api/orders";

// Create styles using @react-pdf/renderer's StyleSheet API
const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    padding: "48px 64px",
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#18181b",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 48,
  },
  logo: {
    width: 40,
    height: 40,
    backgroundColor: "#10b981",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#18181b",
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 11,
    color: "#71717a",
    fontWeight: "medium",
  },
  addressSection: {
    flexDirection: "row",
    marginBottom: 36,
    gap: 40,
  },
  addressBlock: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#18181b",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  addressText: {
    fontSize: 9,
    color: "#52525b",
    lineHeight: 1.6,
    marginBottom: 2,
  },
  addressName: {
    color: "#18181b",
    fontWeight: "bold",
    marginBottom: 2,
  },
  dateSection: {
    marginBottom: 36,
  },
  dateLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#18181b",
    marginBottom: 6,
  },
  dateText: {
    fontSize: 9,
    color: "#52525b",
  },
  tableSection: {
    marginBottom: 36,
  },
  tableTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#18181b",
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
    paddingBottom: 10,
    marginBottom: 8,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#18181b",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
    paddingVertical: 14,
  },
  tableCell: {
    fontSize: 9,
    color: "#52525b",
  },
  productName: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#18181b",
    marginBottom: 3,
  },
  productDesc: {
    fontSize: 8,
    color: "#71717a",
    lineHeight: 1.5,
  },
  col1: { width: "8%" },
  col2: { width: "44%" },
  col3: { width: "12%", textAlign: "right" },
  col4: { width: "18%", textAlign: "right" },
  col5: { width: "18%", textAlign: "right" },
  summarySection: {
    alignItems: "flex-end",
    marginBottom: 72,
  },
  summaryBox: {
    width: "40%",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 9,
    color: "#52525b",
  },
  summaryValue: {
    fontSize: 9,
    color: "#18181b",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e4e4e7",
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#18181b",
  },
  totalValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#18181b",
  },
  footer: {
    flexDirection: "row",
    gap: 32,
  },
  footerBlock: {
    flex: 1,
  },
  footerTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#18181b",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  footerText: {
    fontSize: 9,
    color: "#52525b",
    lineHeight: 1.5,
  },
});

interface InvoicePDFProps {
  order: OrderDetailResponse;
}

const formatCurrencyPDF = (amount: number, currency: string) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

export default function InvoicePDF({ order }: InvoicePDFProps) {
  const isPaid =
    order.payment?.status.toUpperCase() === "SUCCESS" ||
    order.status.toUpperCase() === "COMPLETED";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>M</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.title}>{isPaid ? "Paid" : "Invoice"}</Text>
            <Text style={styles.invoiceNumber}>INV-{order.orderNumber}</Text>
          </View>
        </View>

        {/* Addresses */}
        <View style={styles.addressSection}>
          <View style={styles.addressBlock}>
            <Text style={styles.addressLabel}>Invoice from</Text>
            <Text style={[styles.addressText, styles.addressName]}>
              Ariana Lang
            </Text>
            <Text style={styles.addressText}>4642 Demetris Lane Suite 407</Text>
            <Text style={styles.addressText}>Edmond, AZ / 60888</Text>
            <Text style={[styles.addressText, { marginTop: 6 }]}>
              +54 11 1234-5678
            </Text>
          </View>
          <View style={styles.addressBlock}>
            <Text style={styles.addressLabel}>Invoice to</Text>
            <Text style={[styles.addressText, styles.addressName]}>
              {order.user.name}
            </Text>
            {order.shippingAddress ? (
              <>
                <Text style={styles.addressText}>
                  {order.shippingAddress.street_address}
                </Text>
                <Text style={styles.addressText}>
                  {order.shippingAddress.city}, {order.shippingAddress.state} /{" "}
                  {order.shippingAddress.postal_code}
                </Text>
              </>
            ) : (
              <Text style={[styles.addressText, { fontStyle: "italic" }]}>
                No shipping address
              </Text>
            )}
            <Text style={[styles.addressText, { marginTop: 6 }]}>
              {order.user.email}
            </Text>
          </View>
        </View>

        {/* Date */}
        <View style={styles.dateSection}>
          <Text style={styles.dateLabel}>Date create</Text>
          <Text style={styles.dateText}>
            {format(new Date(order.createdAt), "dd MMM yyyy")}
          </Text>
        </View>

        {/* Invoice Details Table */}
        <View style={styles.tableSection}>
          <Text style={styles.tableTitle}>Invoice details</Text>

          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.col1]}>#</Text>
            <Text style={[styles.tableHeaderCell, styles.col2]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderCell, styles.col3]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.col4]}>
              Unit price
            </Text>
            <Text style={[styles.tableHeaderCell, styles.col5]}>Total</Text>
          </View>

          {/* Table Rows */}
          {order.items.map((item, index) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.col1]}>{index + 1}</Text>
              <View style={styles.col2}>
                <Text style={styles.productName}>{item.product.title}</Text>
                <Text style={styles.productDesc}>
                  {item.product.description}
                </Text>
              </View>
              <Text style={[styles.tableCell, styles.col3]}>
                {item.quantity}
              </Text>
              <Text style={[styles.tableCell, styles.col4]}>
                {formatCurrencyPDF(item.unitPrice, order.currency)}
              </Text>
              <Text style={[styles.productName, styles.col5]}>
                {formatCurrencyPDF(item.totalPrice, order.currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                {formatCurrencyPDF(order.subtotal, order.currency)}
              </Text>
            </View>

            {(order.shippingAmount > 0 ||
              order.discountAmount > 0 ||
              order.taxAmount > 0) && (
              <>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Shipping</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrencyPDF(order.shippingAmount, order.currency)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Discount</Text>
                  <Text style={styles.summaryValue}>
                    -{formatCurrencyPDF(order.discountAmount, order.currency)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Taxes</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrencyPDF(order.taxAmount, order.currency)}
                  </Text>
                </View>
              </>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {formatCurrencyPDF(order.totalAmount, order.currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerBlock}>
            <Text style={styles.footerTitle}>NOTES</Text>
            <Text style={styles.footerText}>
              We appreciate your business. Should you need us to add VAT or
              extra notes let us know!
            </Text>
          </View>
          <View style={[styles.footerBlock, { alignItems: "flex-end" }]}>
            <Text style={styles.footerTitle}>Have a question?</Text>
            <Text style={styles.footerText}>support@abcapp.com</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
