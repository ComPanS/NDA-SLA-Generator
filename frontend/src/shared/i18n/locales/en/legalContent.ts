import type { LegalBundle } from '../../legalTypes';

/**
 * International-facing Terms & Privacy (not Russia-specific).
 * Have qualified counsel review before relying on this in production.
 */
const bundle: LegalBundle = {
  terms: {
    metaTitle: 'Terms of Use — ContractAI',
    metaDescription:
      'Terms of Use for ContractAI: account access, acceptable use, limitations of liability, and third-party services.',
    path: '/terms',
    h1: 'Terms of Use',
    blocks: [
      {
        type: 'p',
        text: 'These Terms of Use (“Terms”) govern your use of ContractAI (the “Operator”, “we”, “us”), an online service that helps you draft agreements and related documents using artificial intelligence (the “Service”), accessible at dogovarai.ru and associated web properties (the “Site”).',
      },
      {
        type: 'p',
        text: 'By accessing or using the Service in any way (including browsing, registering, generating documents, or paying for plans), you agree to these Terms. If you do not agree, do not use the Service.',
      },
      { type: 'h6', text: '1. Eligibility and accounts' },
      {
        type: 'p',
        text: '1.1. You must be at least 18 years old (or the age of majority where you live) to use the Service on your own behalf. If you use the Service on behalf of an organization, you represent that you are authorized to bind it.',
      },
      {
        type: 'p',
        text: '1.2. Full functionality may require registration with a valid email address and password. You may also authenticate through third parties (for example Yandex or Google); their terms and privacy policies apply to that login path.',
      },
      {
        type: 'p',
        text: '1.3. You agree to provide accurate account information and to keep credentials confidential. We may suspend accounts involved in fraud, abuse, or misrepresentation.',
      },
      {
        type: 'p',
        text: '1.4. The Service may be offered under subscription plans with different limits (such as monthly document generations, templates, export formats, AI-assisted revisions, and optional features). Current fees and limits are shown on the Site and may change.',
      },
      {
        type: 'p',
        text: '1.5. If you reach your plan limits, you may be able to purchase add-on capacity where offered on the Site.',
      },
      {
        type: 'p',
        text: '1.6. We may modify, limit, or discontinue features or the Service as a whole, for security, legal, or operational reasons.',
      },
      { type: 'h6', text: '2. Acceptable use' },
      {
        type: 'p',
        text: '2.1. You will use the Service only for lawful purposes and in compliance with applicable law.',
      },
      { type: 'p', text: '2.2. You must not:' },
      {
        type: 'ul',
        items: [
          'use the Service to create content that is unlawful, defamatory, infringing, fraudulent, or harmful;',
          'submit someone else’s personal data without a lawful basis;',
          'probe, scrape, or attack our systems, or attempt unauthorized access;',
          'share account credentials or resell access;',
          'reverse engineer the Service or compete by cloning its core functionality in breach of applicable law.',
        ],
      },
      {
        type: 'p',
        text: '2.3. You are responsible for prompts, inputs, and generated outputs you choose to rely on. We do not guarantee that any draft is legally sufficient for your situation.',
      },
      {
        type: 'p',
        text: '2.4. The Service is not legal advice. You should review outputs carefully and consult licensed professionals for high-stakes matters.',
      },
      { type: 'h6', text: '3. Disclaimers and limitation of liability' },
      {
        type: 'p',
        text: '3.1. The Service is provided “as is” and “as available”. We disclaim implied warranties to the fullest extent permitted by law.',
      },
      {
        type: 'p',
        text: '3.2. To the extent permitted by law, we are not liable for indirect, incidental, special, consequential, or punitive damages, or loss of profits, data, or goodwill.',
      },
      {
        type: 'p',
        text: '3.3. We are not responsible for third-party services (payments, hosting, AI model providers, identity providers).',
      },
      {
        type: 'p',
        text: '3.4. Where liability cannot be excluded, our aggregate liability arising out of these Terms or the Service is limited to the fees you paid to us in the twelve (12) months before the claim arose (or fifty (50) US dollars if you only used free functionality).',
      },
      {
        type: 'p',
        text: '3.5. Some jurisdictions do not allow certain limitations; in those cases our liability is limited to the maximum permitted by law.',
      },
      { type: 'h6', text: '4. General' },
      {
        type: 'p',
        text: '4.1. We may update these Terms by posting a new version on the Site. Continued use after changes become effective constitutes acceptance unless applicable law requires additional steps.',
      },
      {
        type: 'p',
        text: '4.2. These Terms are governed by the laws of the jurisdiction where the Operator is established, without regard to conflict-of-law rules. Courts in that jurisdiction have non-exclusive jurisdiction, unless mandatory local law gives you a right to sue elsewhere.',
      },
      {
        type: 'p',
        text: '4.3. Contact: support@dogovarai.ru.',
      },
      {
        type: 'p',
        text: '4.4. Effective date: 3 February 2026.',
      },
    ],
  },
  privacy: {
    metaTitle: 'Privacy Policy — ContractAI',
    metaDescription:
      'How ContractAI collects, uses, and protects personal data when you use our AI-assisted contract service.',
    path: '/privacy',
    h1: 'Privacy Policy',
    blocks: [
      {
        type: 'p',
        text: 'This Privacy Policy explains how ContractAI (“Operator”, “we”) processes personal data when you use our AI-assisted document service available at dogovarai.ru and related properties (the “Service”).',
      },
      {
        type: 'p',
        text: 'If you are in the European Economic Area, the UK, or Switzerland, additional rights under the GDPR (or local equivalent) may apply alongside this Policy.',
      },
      { type: 'h6', text: '1. Data controller and contact' },
      {
        type: 'p',
        text: '1.1. The Operator is responsible for personal data described here. For privacy requests, email support@dogovarai.ru with the subject line “Privacy request”.',
      },
      {
        type: 'p',
        text: '1.2. By using the Service, you acknowledge this Policy. If you disagree, please stop using the Service.',
      },
      { type: 'h6', text: '2. Categories of data and purposes' },
      {
        type: 'p',
        text: '2.1. We may process:',
      },
      {
        type: 'ul',
        items: [
          'Account data: email, optional display name, password hashes;',
          'Technical data: IP address, cookies, device/browser metadata, approximate location inferred from IP;',
          'Content you submit: prompts, fields, and any personal data you type into forms for document generation;',
          'Payment metadata: transactions are handled by payment processors; we typically receive status, amounts, and limited card metadata (such as last four digits);',
          'Support communications you send us.',
        ],
      },
      {
        type: 'p',
        text: '2.2. We use personal data to:',
      },
      {
        type: 'ul',
        items: [
          'provide, secure, and improve the Service;',
          'authenticate users and manage subscriptions;',
          'invoke AI providers to generate text you request;',
          'conduct analytics in aggregated or de-identified form where possible;',
          'comply with law and respond to lawful requests.',
        ],
      },
      {
        type: 'p',
        text: '2.3. Legal bases (where GDPR applies) may include contract performance, legitimate interests (such as securing accounts and improving the product), compliance with legal obligations, and consent where required.',
      },
      {
        type: 'p',
        text: '2.4. Inputs you provide may be transmitted to sub-processors such as AI model hosts (for example YandexGPT or others we configure) solely to fulfil your request. We select providers that commit to confidentiality and security appropriate to the processing.',
      },
      { type: 'h6', text: '3. International transfers' },
      {
        type: 'p',
        text: '3.1. We may process data in multiple countries. Where data moves from the EEA/UK/Switzerland to other countries, we rely on appropriate safeguards such as Standard Contractual Clauses or other mechanisms recognized by regulators, unless an exception applies.',
      },
      { type: 'h6', text: '4. Retention and security' },
      {
        type: 'p',
        text: '4.1. We retain account data while your account is active and for a limited period afterward for security, disputes, and legal compliance.',
      },
      {
        type: 'p',
        text: '4.2. Ephemeral generation inputs may be deleted automatically after a short window unless you save the document in your account—see in-product notices or support for current retention windows.',
      },
      {
        type: 'p',
        text: '4.3. We apply technical and organizational measures including encryption in transit, access controls, and monitoring, but no method of transmission or storage is completely secure.',
      },
      { type: 'h6', text: '5. Your rights' },
      {
        type: 'p',
        text: '5.1. Depending on your location, you may have rights to access, rectify, delete, restrict, or port your data, and to object to certain processing. You may also lodge a complaint with a supervisory authority in your country or region.',
      },
      {
        type: 'p',
        text: '5.2. To exercise rights, contact support@dogovarai.ru. We will respond within the timeframes required by applicable law.',
      },
      {
        type: 'p',
        text: '5.3. The Service is not directed to children. If you believe we collected data from a child without appropriate consent, contact us so we can delete it.',
      },
      { type: 'h6', text: '6. Changes' },
      {
        type: 'p',
        text: '6.1. We may update this Policy from time to time. Material changes will be posted on the Site with an updated effective date.',
      },
    ],
  },
};

export default bundle;
