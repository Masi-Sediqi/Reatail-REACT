import { useState } from 'react'
import { ChevronDown } from '../components/Icons.jsx'
import './FAQ.css'

const faqItems = [
  {
    question: 'How do I create a new product?',
    answer: 'Go to Products -> click Add Product -> fill in the product details including name, category, unit, purchase price, selling price, and initial stock quantity. Click Save to add the product.',
  },
  {
    question: 'How do I create a bill/invoice?',
    answer: 'Go to Billing, select a customer or create a new one, add products to the bill, choose payment details, and save or print the invoice.',
  },
  {
    question: 'How do I track supplier payments?',
    answer: 'Open Suppliers/Katanama, select the supplier, and review the ledger entries. Purchases, payments, remaining balance, and goods tracking are recorded there.',
  },
  {
    question: 'How do I change the language?',
    answer: 'Use the language icon in the top bar to switch between English, Dari, and Pashto. The layout supports RTL languages automatically.',
  },
  {
    question: 'How do I back up my data?',
    answer: 'Go to Settings -> Backup & Restore -> Export Data. The system downloads a JSON backup file that you can keep safely and import later.',
  },
  {
    question: 'How do I print reports?',
    answer: 'Open Reports, choose the report type and date range, then use the print or export option. Print appearance can be adjusted from Settings.',
  },
  {
    question: 'How do I manage multiple currencies?',
    answer: 'Go to Settings and set the base currency and exchange rates. The dashboard and reports can convert values using the configured rates.',
  },
  {
    question: 'How do I manage staff and payroll?',
    answer: 'Open Staff to add employees, roles, salaries, and related details. Staff salary values are included in business financial calculations.',
  },
  {
    question: 'How does Advanced Multi-Device Sync work?',
    answer: 'Advanced sync lets different devices share business data through backup and restore flows. Keep backup files trusted and import only files from your own system.',
  },
  {
    question: 'What is the difference between Full and Incremental backup?',
    answer: 'A full backup contains all system data. An incremental backup is intended for sharing only recent changes from another branch or device.',
  },
  {
    question: 'How do I undo a mistake (delete, edit, payment)?',
    answer: 'Deleted records go to Recycle Bin when supported, where you can restore them. For edited payments or bills, open the related module and update the record again.',
  },
  {
    question: 'How do I collect data from multiple branches into one admin PC?',
    answer: 'On each branch, create a backup from Settings. On the admin PC, import the backup file through Settings -> Backup & Restore. Review imported records after each restore.',
  },
]

function FAQ() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <div className="faq-page">
      <section className="faq-shell">
        <div className="faq-hero">
          <div className="faq-logo">
            <img src="/logo.jpeg" alt="NEXORA" />
          </div>
          <h1>FAQ</h1>
          <p>Frequently asked questions about the system</p>
        </div>

        <div className="faq-list">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index

            return (
              <article className={`faq-item ${isOpen ? 'open' : ''}`} key={item.question}>
                <button
                  className="faq-question"
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                >
                  <span>{item.question}</span>
                  <ChevronDown size={15} />
                </button>
                {isOpen && <p className="faq-answer">{item.answer}</p>}
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default FAQ
