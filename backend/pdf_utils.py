from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_RIGHT, TA_CENTER
import io
from datetime import datetime

def generate_salary_pdf(slip_data, user_email):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    elements = []
    styles = getSampleStyleSheet()

    # --- 1. HEADER SECTION ---
    # Company Name
    company_style = ParagraphStyle('Company', parent=styles['Heading1'], fontSize=22, textColor=colors.darkblue)
    elements.append(Paragraph("PAYSTREAM INC.", company_style))
    
    # Subheader
    address_style = ParagraphStyle('Address', parent=styles['Normal'], fontSize=10, textColor=colors.grey)
    elements.append(Paragraph("123, Tech Park, XYZ Valley, India", address_style))
    elements.append(Paragraph("Tax ID: 99-12345678", address_style))
    elements.append(Spacer(1, 0.4 * inch))

    # Title
    title_style = ParagraphStyle('Title', parent=styles['Heading2'], alignment=TA_CENTER, spaceAfter=20)
    elements.append(Paragraph(f"PAYSLIP FOR {slip_data['month'].upper()} {slip_data['year']}", title_style))

    # --- 2. EMPLOYEE DETAILS GRID ---
    # We arrange this in a 2x2 invisible table for alignment
    emp_data = [
        ["Employee Email:", user_email, "Payslip ID:", str(slip_data['_id'])[-8:].upper()],
        ["Department:", "Engineering", "Pay Date:", datetime.utcnow().strftime('%d %b, %Y')],
        ["Bank Name:", "HDFC Bank", "Account No:", "XXXX-XXXX-8899"]
    ]
    
    t_emp = Table(emp_data, colWidths=[1.2*inch, 2.5*inch, 1.2*inch, 2.0*inch])
    t_emp.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'), # Labels Bold
        ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'), # Labels Bold
        ('TEXTCOLOR', (0,0), (-1,-1), colors.darkslategrey),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(t_emp)
    elements.append(Spacer(1, 0.3 * inch))

    # --- 3. SALARY BREAKDOWN (Reversed Calculated) ---
    # Logic: Break total amount into standard components
    total = float(slip_data['amount'])
    basic = round(total * 0.50, 2)
    hra = round(total * 0.20, 2)
    special = round(total * 0.25, 2)
    bonus = round(total - (basic + hra + special), 2) # Remainder

    data = [
        ["Earnings", "Amount ($)"],
        ["Basic Salary", f"{basic:,.2f}"],
        ["House Rent Allowance", f"{hra:,.2f}"],
        ["Special Allowance", f"{special:,.2f}"],
        ["Performance Bonus", f"{bonus:,.2f}"],
        ["", ""], # Spacer row
        ["GROSS TOTAL", f"{total:,.2f}"]
    ]

    # Table Layout
    t = Table(data, colWidths=[4.5*inch, 2.0*inch])
    t.setStyle(TableStyle([
        # Header Row
        ('BACKGROUND', (0,0), (1,0), colors.darkblue),
        ('TEXTCOLOR', (0,0), (1,0), colors.whitesmoke),
        ('FONTNAME', (0,0), (1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (1,0), 12),
        ('BOTTOMPADDING', (0,0), (1,0), 10),
        ('TOPPADDING', (0,0), (1,0), 10),
        
        # Rows
        ('BACKGROUND', (0,1), (-1,-2), colors.whitesmoke),
        ('GRID', (0,0), (-1,-2), 0.5, colors.lightgrey),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'), # Align amounts right
        ('rightPadding', (1,0), (1,-1), 20), # Padding for amounts
        
        # Total Row
        ('LINEABOVE', (0,-1), (-1,-1), 1, colors.black),
        ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,-1), (-1,-1), 14),
        ('BACKGROUND', (0,-1), (-1,-1), colors.lightgrey),
        ('TEXTCOLOR', (0,-1), (-1,-1), colors.black),
        ('BOTTOMPADDING', (0,-1), (-1,-1), 12),
        ('TOPPADDING', (0,-1), (-1,-1), 12),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 0.5 * inch))

    # --- 4. NET PAY HIGHLIGHT ---
    net_style = ParagraphStyle('NetPay', parent=styles['Heading3'], alignment=TA_RIGHT, textColor=colors.green, fontSize=16)
    elements.append(Paragraph(f"NET PAYABLE: ${total:,.2f}", net_style))
    elements.append(Spacer(1, 1 * inch))

    # --- 5. FOOTER ---
    footer_text = """
    <font size="8" color="grey">
    This is a system-generated payslip and does not require a physical signature.<br/>
    For any discrepancies, please contact hire-me@anshumat.org within 3 working days.<br/>
    Confidentiality Notice: The information contained in this document is confidential and intended only for the employee named above.
    </font>
    """
    elements.append(Paragraph(footer_text, styles['Normal']))

    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer