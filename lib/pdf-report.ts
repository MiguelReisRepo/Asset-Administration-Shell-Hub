/**
 * Professional PDF Report Generator for AAS Forge
 * Generates validation reports for Asset Administration Shell models
 */

import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { ValidationResult } from "./types"

// Brand colors
const BRAND_PRIMARY = "#61caf3"
const BRAND_DARK = "#3a9fd4"
const TEXT_DARK = "#1f2937"
const TEXT_GRAY = "#6b7280"
const SUCCESS_GREEN = "#10b981"

interface ReportOptions {
  includeRawData?: boolean
}

/**
 * Generate a professional PDF validation report
 */
export async function generateValidationReport(
  file: ValidationResult,
  options: ReportOptions = {}
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let yPos = margin

  // Helper to add new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - 30) {
      doc.addPage()
      yPos = margin
      addHeader(doc, pageWidth)
      yPos = 45
    }
  }

  // Extract AAS data
  const aasData = file.aasData || file.parsed
  const shell = aasData?.assetAdministrationShells?.[0]
  const submodels = aasData?.submodels || []
  const idShort = shell?.idShort || file.file || "Unknown AAS"
  const aasId = shell?.id || "N/A"
  const assetKind = shell?.assetInformation?.assetKind || "Instance"
  const globalAssetId = shell?.assetInformation?.globalAssetId || "N/A"

  // ===== COVER PAGE =====
  addCoverPage(doc, {
    idShort,
    isValid: file.valid === true,
    generatedAt: new Date(),
    pageWidth,
    pageHeight,
  })

  // ===== CONTENT PAGES =====
  doc.addPage()
  yPos = margin

  // Header
  addHeader(doc, pageWidth)
  yPos = 45

  // Section 1: Validation Summary
  yPos = addSectionTitle(doc, "1. Validation Summary", yPos, margin)

  const validationData = [
    ["Status", file.valid === true ? "VALID" : "INVALID"],
    ["File Name", file.file || "N/A"],
    ["File Type", file.type || "N/A"],
    ["Processing Time", `${file.processingTime || 0} ms`],
    ["Validation Date", new Date().toLocaleString()],
  ]

  autoTable(doc, {
    startY: yPos,
    head: [["Property", "Value"]],
    body: validationData,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [97, 202, 243],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    bodyStyles: {
      textColor: [31, 41, 55],
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50 },
      1: { cellWidth: "auto" },
    },
    didParseCell: (data) => {
      // Only apply to body section, not header
      if (data.section === 'body' && data.column.index === 1 && data.row.index === 0) {
        // Keep same text color as other rows (black/dark gray)
        data.cell.styles.textColor = [31, 41, 55]
        data.cell.styles.fontStyle = "bold"
      }
    },
  })

  yPos = (doc as any).lastAutoTable.finalY + 15

  // Section 2: AAS Information
  checkPageBreak(60)
  yPos = addSectionTitle(doc, "2. Asset Administration Shell Information", yPos, margin)

  const aasInfoData = [
    ["IdShort", idShort],
    ["AAS ID", aasId],
    ["Asset Kind", assetKind],
    ["Global Asset ID", globalAssetId],
  ]

  // Add description if available
  if (shell?.description) {
    const desc = Array.isArray(shell.description)
      ? shell.description.find((d: any) => d.language === "en")?.text || shell.description[0]?.text
      : shell.description
    if (desc) {
      aasInfoData.push(["Description", desc])
    }
  }

  autoTable(doc, {
    startY: yPos,
    head: [["Property", "Value"]],
    body: aasInfoData,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [97, 202, 243],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    bodyStyles: {
      textColor: [31, 41, 55],
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50 },
      1: { cellWidth: "auto" },
    },
  })

  yPos = (doc as any).lastAutoTable.finalY + 15

  // Section 3: Submodels Overview
  if (submodels.length > 0) {
    checkPageBreak(60)
    yPos = addSectionTitle(doc, "3. Submodels Overview", yPos, margin)

    const submodelData = submodels.map((sm: any, idx: number) => [
      (idx + 1).toString(),
      sm.idShort || "N/A",
      sm.id || "N/A",
      (sm.submodelElements?.length || 0).toString(),
    ])

    autoTable(doc, {
      startY: yPos,
      head: [["#", "IdShort", "Semantic ID", "Elements"]],
      body: submodelData,
      margin: { left: margin, right: margin },
      headStyles: {
        fillColor: [97, 202, 243],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      bodyStyles: {
        textColor: [31, 41, 55],
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { fontStyle: "bold", cellWidth: 40 },
        2: { cellWidth: "auto", fontSize: 8 },
        3: { cellWidth: 20, halign: "center" },
      },
    })

    yPos = (doc as any).lastAutoTable.finalY + 15
  }

  // Section 4: Applied Fixes (if any fixes were applied)
  if (file.appliedFixes && file.appliedFixes.length > 0) {
    checkPageBreak(50)
    yPos = addSectionTitle(doc, "4. Applied Fixes", yPos, margin)

    // Add summary text
    doc.setTextColor(31, 41, 55)
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text(
      `The following ${file.appliedFixes.length} fix${file.appliedFixes.length !== 1 ? "es were" : " was"} automatically applied to make the file compliant with AAS 3.1 specification:`,
      margin,
      yPos
    )
    yPos += 8

    const fixRows = file.appliedFixes.map((fix, idx) => [
      (idx + 1).toString(),
      fix.element || "N/A",
      fix.issue || "N/A",
      fix.fix || "N/A",
    ])

    autoTable(doc, {
      startY: yPos,
      head: [["#", "Element", "Issue", "Fix Applied"]],
      body: fixRows,
      margin: { left: margin, right: margin },
      headStyles: {
        fillColor: [16, 185, 129], // Green for fixes
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      bodyStyles: {
        textColor: [31, 41, 55],
        fontSize: 7,
      },
      alternateRowStyles: {
        fillColor: [236, 253, 245], // Light green
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 35 },
        2: { cellWidth: 50 },
        3: { cellWidth: "auto" },
      },
    })

    yPos = (doc as any).lastAutoTable.finalY + 15
  }

  // Add page numbers
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(doc, i, totalPages, pageWidth, pageHeight)
  }

  return doc.output("blob")
}

/**
 * Add cover page
 */
function addCoverPage(
  doc: jsPDF,
  options: {
    idShort: string
    isValid: boolean
    generatedAt: Date
    pageWidth: number
    pageHeight: number
  }
) {
  const { idShort, isValid, generatedAt, pageWidth, pageHeight } = options
  const centerX = pageWidth / 2

  // Background gradient effect (simplified)
  doc.setFillColor(97, 202, 243)
  doc.rect(0, 0, pageWidth, 100, "F")

  // Decorative element
  doc.setFillColor(77, 182, 230)
  doc.circle(pageWidth - 30, 30, 60, "F")
  doc.setFillColor(58, 159, 212)
  doc.circle(-20, 80, 50, "F")

  // Logo area with robot icon
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(centerX - 25, 25, 50, 50, 10, 10, "F")

  // Draw robot icon (white background, dark icon)
  const robotX = centerX
  const robotY = 50
  doc.setFillColor(58, 159, 212) // Brand dark color for robot

  // Robot head
  doc.roundedRect(robotX - 12, robotY - 15, 24, 20, 3, 3, "F")

  // Robot eyes
  doc.setFillColor(255, 255, 255)
  doc.circle(robotX - 5, robotY - 8, 3, "F")
  doc.circle(robotX + 5, robotY - 8, 3, "F")

  // Robot antenna
  doc.setFillColor(58, 159, 212)
  doc.rect(robotX - 1, robotY - 20, 2, 5, "F")
  doc.circle(robotX, robotY - 22, 3, "F")

  // Robot body
  doc.roundedRect(robotX - 15, robotY + 7, 30, 18, 3, 3, "F")

  // Robot body details (chest panel)
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(robotX - 8, robotY + 10, 16, 8, 2, 2, "F")

  // AAS Forge text
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(32)
  doc.setFont("helvetica", "bold")
  doc.text("AAS Forge", centerX, 130, { align: "center" })

  // Report title
  doc.setFontSize(14)
  doc.setFont("helvetica", "normal")
  doc.text("Validation Report", centerX, 145, { align: "center" })

  // Divider
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(50, 165, pageWidth - 50, 165)

  // AAS Name
  doc.setTextColor(31, 41, 55)
  doc.setFontSize(24)
  doc.setFont("helvetica", "bold")
  doc.text(idShort, centerX, 190, { align: "center" })

  // Validation status badge
  const statusY = 210
  const badgeWidth = 60
  const badgeHeight = 12

  if (isValid) {
    doc.setFillColor(16, 185, 129)
    doc.roundedRect(centerX - badgeWidth / 2, statusY - 8, badgeWidth, badgeHeight, 3, 3, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("VALID", centerX, statusY, { align: "center" })
  } else {
    doc.setFillColor(239, 68, 68)
    doc.roundedRect(centerX - badgeWidth / 2, statusY - 8, badgeWidth, badgeHeight, 3, 3, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("INVALID", centerX, statusY, { align: "center" })
  }

  // Generation info
  doc.setTextColor(107, 114, 128)
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`Generated on ${generatedAt.toLocaleDateString()} at ${generatedAt.toLocaleTimeString()}`, centerX, 235, { align: "center" })

  // Compliance text
  doc.setFontSize(9)
  doc.text("Asset Administration Shell 3.0 Specification", centerX, 250, { align: "center" })

  // Footer text on cover
  doc.setTextColor(156, 163, 175)
  doc.setFontSize(8)
  doc.text("This report was automatically generated by AAS Forge", centerX, pageHeight - 30, { align: "center" })
  doc.text("https://aas-forge.app", centerX, pageHeight - 22, { align: "center" })
}

/**
 * Add page header
 */
function addHeader(doc: jsPDF, pageWidth: number) {
  // Header bar
  doc.setFillColor(97, 202, 243)
  doc.rect(0, 0, pageWidth, 12, "F")

  // Logo text
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("AAS Forge", 20, 8)

  // Subtitle
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text("Validation Report", pageWidth - 20, 8, { align: "right" })

  // Divider line
  doc.setDrawColor(229, 231, 235)
  doc.setLineWidth(0.3)
  doc.line(20, 18, pageWidth - 20, 18)
}

/**
 * Add page footer
 */
function addFooter(doc: jsPDF, currentPage: number, totalPages: number, pageWidth: number, pageHeight: number) {
  // Skip footer on cover page
  if (currentPage === 1) return

  doc.setDrawColor(229, 231, 235)
  doc.setLineWidth(0.3)
  doc.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15)

  doc.setTextColor(156, 163, 175)
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")

  // Page number
  doc.text(`Page ${currentPage - 1} of ${totalPages - 1}`, pageWidth / 2, pageHeight - 8, { align: "center" })

  // Timestamp
  doc.text("AAS Forge Validation Report", 20, pageHeight - 8)

  // Date
  doc.text(new Date().toLocaleDateString(), pageWidth - 20, pageHeight - 8, { align: "right" })
}

/**
 * Add section title
 */
function addSectionTitle(doc: jsPDF, title: string, yPos: number, margin: number): number {
  doc.setTextColor(31, 41, 55)
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text(title, margin, yPos)

  // Underline
  doc.setDrawColor(97, 202, 243)
  doc.setLineWidth(1)
  doc.line(margin, yPos + 2, margin + doc.getTextWidth(title), yPos + 2)

  return yPos + 12
}

/**
 * Truncate text with ellipsis
 */
function truncate(text: string, maxLength: number): string {
  if (!text) return "—"
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + "..."
}

/**
 * Download the PDF report
 */
export async function downloadValidationReport(file: ValidationResult, options?: ReportOptions): Promise<void> {
  const blob = await generateValidationReport(file, options)

  const idShort = file.aasData?.assetAdministrationShells?.[0]?.idShort ||
                  file.parsed?.assetAdministrationShells?.[0]?.idShort ||
                  "aas"

  const filename = `${idShort}_validation_report_${new Date().toISOString().split("T")[0]}.pdf`

  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
