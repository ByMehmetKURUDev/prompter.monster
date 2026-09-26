import type { LegalDoc, LegalInfo, LegalSlug } from "./types";

/** English legal texts. The Turkish version prevails if the two ever differ (stated in the footer of each page). */

function controller(i: LegalInfo): string {
  return `**${i.name}**${i.address ? ` (${i.address})` : ""}`;
}

function registry(i: LegalInfo): string[] {
  return i.registry ? [`Registration / tax details: ${i.registry}.`] : [];
}

function mail(i: LegalInfo): string {
  return `[${i.email}](mailto:${i.email})`;
}

const LS = "Lemon Squeezy (operated by Link, LLC, formerly Lemon Squeezy LLC, USA)";

export function enDoc(slug: LegalSlug, i: LegalInfo): LegalDoc {
  switch (slug) {
    case "terms":
      return {
        slug,
        title: "Terms of Service",
        short: "Terms",
        description: "The terms for using Prompt.Monster: accounts, plans and billing, content ownership, acceptable use, liability and disputes.",
        intro: [
          `These terms govern your use of the Prompt.Monster website (${i.site}), the Studio, the API and integrations (together, the "Service"). By using the Service or creating an account you agree to these terms. If you do not agree, please do not use the Service.`,
        ],
        sections: [
          {
            id: "provider",
            h: "1. Who provides the Service",
            blocks: [{ p: `The Service is operated by ${controller(i)}. Contact: ${mail(i)}.` }, ...registry(i).map((p) => ({ p }))],
          },
          {
            id: "service",
            h: "2. What the Service does",
            blocks: [
              { p: "Prompt.Monster is software that turns a project idea into build prompts for tools such as Claude Code, Cursor, v0, Lovable and Bolt, using expert persona templates and AI assistance. Some features work by sending the text you enter to a third-party AI model (Anthropic Claude)." },
              { p: "AI output can be wrong, incomplete or outdated. You are responsible for reviewing and testing the prompts you generate, and the code you build with them, before relying on them. The Service is not legal, financial, medical or security advice." },
            ],
          },
          {
            id: "account",
            h: "3. Your account",
            blocks: [
              {
                ul: [
                  "Give a valid email address when you sign up. You are responsible for keeping your account and password secure; tell us immediately if you notice unauthorised use.",
                  "Accounts are personal. Sharing an account between several people, or opening several accounts to get around usage limits, is not allowed.",
                  "You must be at least 16 to use the Service. For paid plans you must be 18 or have the consent of a parent or guardian.",
                  "You can use the core Studio without an account; saving, sharing and some AI features require one.",
                ],
              },
            ],
          },
          {
            id: "billing",
            h: "4. Plans, billing and renewal",
            blocks: [
              {
                ul: [
                  "The Free plan costs nothing and includes usage limits. Current limits and prices are on the [Pricing](/pricing) page.",
                  "Monster Pro is a monthly or yearly subscription that renews automatically for the same period until you cancel.",
                  `Payments are collected by ${LS} as the merchant of record. Your purchase is also subject to Lemon Squeezy's buyer terms; Lemon Squeezy issues your invoice and handles taxes such as VAT. We never receive your card details.`,
                  "You can cancel at any time. Cancelling stops the next renewal; Pro stays active until the end of the period you paid for, then your account moves to Free and your projects are kept.",
                  "Pro includes fair-use limits (daily and monthly AI allowances) to prevent abuse and runaway costs. These limits are shown on the pricing page.",
                  "We give existing subscribers at least 30 days' notice of a price change, which applies from the first renewal after the notice.",
                  "Refunds are covered by our [Refund Policy](/legal/refund).",
                ],
              },
            ],
          },
          {
            id: "content",
            h: "5. Your content and outputs",
            blocks: [
              {
                ul: [
                  "The text you enter in the Studio (ideas, descriptions, selections) and the prompts the Service generates for you belong to you to the extent the law allows. You may use them however you like, including in commercial projects.",
                  "To run the Service (storing, displaying, sending to the AI model, backing up) you grant us a limited, worldwide, royalty-free licence to process your content. It ends when you delete the content or close your account, apart from removal from backups within a reasonable time.",
                  "We do not use your content to train AI models, and under its commercial terms our model provider does not train on content sent through its API either.",
                  "Pages you create with Share (/p/…) are public: anyone with the link can view them and they may appear in search engines. Do not put information you would not share on these pages; you can remove a share at any time.",
                  "We recommend never putting passwords, API keys, personal data or confidential business information into prompts.",
                  "You are responsible for making sure the content you enter is lawful and does not infringe anyone else's rights.",
                ],
              },
            ],
          },
          {
            id: "acceptable-use",
            h: "6. Acceptable use",
            blocks: [
              { p: "You may not use the Service to:" },
              {
                ul: [
                  "create unlawful content or infringe others' copyright, trademarks, personality or other rights",
                  "build malware, fraud, phishing, spam or cyber-attack tools",
                  "get around usage limits, billing or security measures, or overload the Service with automated tools",
                  "resell the Service without permission, rent out API access, or scrape it systematically to build a competing product",
                  "make requests that break the AI provider's usage policies",
                ],
              },
              { p: "If these rules are broken we may remove the content concerned, or suspend or close the account." },
            ],
          },
          {
            id: "api",
            h: "7. API and integrations",
            blocks: [
              { p: "If you access the Service through the API, an MCP server, a browser extension or another integration, you are responsible for keeping your keys secret and respecting rate limits. Tell us straight away if a key is misused; you can revoke it and create a new one." },
            ],
          },
          {
            id: "ip",
            h: "8. Intellectual property",
            blocks: [
              { p: "The Prompt.Monster name, logo, interface, expert persona texts, templates and software belong to us or our licensors. Parts of the software published under an open-source licence are governed by that licence. Apart from a personal, non-transferable, non-exclusive right to use the Service in line with these terms, these terms give you no rights." },
            ],
          },
          {
            id: "changes-outages",
            h: "9. Changes and interruptions",
            blocks: [
              { p: "We may add, change or remove features to improve the Service. There may be temporary interruptions for maintenance, third-party outages or events beyond our control. If we make a change that materially reduces the core features of a paid plan, we will tell you in advance and let you cancel." },
            ],
          },
          {
            id: "liability",
            h: "10. Disclaimer and limitation of liability",
            blocks: [
              { p: "The Service is provided \"as is\" and \"as available\". To the maximum extent permitted by law, we do not guarantee that it will be uninterrupted or error-free, or that AI output will be accurate or fit for a particular purpose." },
              { p: "Except for intent, gross negligence and liability that consumer law does not allow us to exclude, we are not liable for indirect damages or loss of profit or data, and our total liability is limited to the amount you paid for the Service in the 12 months before the event giving rise to the claim." },
            ],
          },
          {
            id: "termination",
            h: "11. Termination",
            blocks: [
              { p: `You can close your account at any time by writing to ${mail(i)}. If you breach these terms we may suspend or close your account; except for serious breaches we will try to warn you first. On termination, prepaid fees are not refunded except as described in the [Refund Policy](/legal/refund).` },
            ],
          },
          {
            id: "law",
            h: "12. Governing law and disputes",
            blocks: [
              { p: "These terms are governed by the laws of the Republic of Türkiye. Consumers keep their rights under Turkish Consumer Protection Law No. 6502 and may apply to consumer arbitration committees (within their monetary limits) or consumer courts. Consumers resident in the European Union keep the protection of the mandatory consumer laws of their country of residence." },
            ],
          },
          {
            id: "updates",
            h: "13. Changes to these terms",
            blocks: [
              { p: "We may update these terms from time to time. We will announce material changes on the site or by email a reasonable time before they take effect. Continuing to use the Service after a change means you accept the updated terms." },
            ],
          },
          {
            id: "contact",
            h: "14. Contact",
            blocks: [{ p: `Questions and notices: ${mail(i)}` }],
          },
        ],
      };

    case "privacy":
      return {
        slug,
        title: "Privacy Policy",
        short: "Privacy",
        description: "What personal data Prompt.Monster processes, why and on what legal basis; who we share it with, how long we keep it and your rights under KVKK and the GDPR.",
        intro: [
          "This policy explains how your personal data is processed when you use Prompt.Monster, in line with Turkish Personal Data Protection Law No. 6698 (\"KVKK\", Article 10) and the EU General Data Protection Regulation (\"GDPR\"). We do not sell your personal data.",
        ],
        sections: [
          {
            id: "controller",
            h: "1. Data controller",
            blocks: [{ p: `Data controller: ${controller(i)}. Contact: ${mail(i)}.` }, ...registry(i).map((p) => ({ p }))],
          },
          {
            id: "data",
            h: "2. The personal data we process",
            blocks: [
              {
                table: {
                  head: ["Category", "Examples", "Source"],
                  rows: [
                    ["Identity and contact", "Email address, your name (if you give it)", "Sign-up form, payment provider"],
                    ["Account security", "Password (hashed only, held by our authentication provider), session data", "Sign-up and sign-in"],
                    ["Content", "Project ideas, descriptions, selections, generated prompts, versions, share pages", "What you enter in the Studio"],
                    ["Usage and transactions", "AI usage records (feature, time, model, token counts), plan and subscription status, the campaign source you arrived from", "Automatic"],
                    ["Payment", "Order and subscription IDs, plan, country, billing email (card details never reach us)", "Lemon Squeezy"],
                    ["Technical", "IP address, browser and device information, error logs", "Automatic"],
                    ["Correspondence", "Emails and support requests you send us", "You"],
                    ["Cookie data (only with your consent)", "Analytics and ad measurement data", "Cookies — see the [Cookie Policy](/legal/cookies)"],
                  ],
                },
              },
            ],
          },
          {
            id: "purposes",
            h: "3. Purposes and legal bases",
            blocks: [
              {
                table: {
                  head: ["Purpose", "Legal basis (KVKK Art. 5 / GDPR Art. 6)"],
                  rows: [
                    ["Creating your account, signing in, providing the Service, storing your projects", "Performance of a contract (KVKK 5/2-c; GDPR 6(1)(b))"],
                    ["Running the AI features (sending your text to the model)", "Performance of a contract (KVKK 5/2-c; GDPR 6(1)(b))"],
                    ["Subscriptions, payments, invoicing and refunds", "Contract and legal obligation (KVKK 5/2-c, 5/2-ç; GDPR 6(1)(b), 6(1)(c))"],
                    ["Transactional emails (verification, password reset, billing notices)", "Performance of a contract (KVKK 5/2-c; GDPR 6(1)(b))"],
                    ["Security, preventing abuse and fraud, usage limits", "Legitimate interests (KVKK 5/2-f; GDPR 6(1)(f))"],
                    ["Improving the Service, aggregate statistics, campaign source measurement (no individual profiling)", "Legitimate interests (KVKK 5/2-f; GDPR 6(1)(f))"],
                    ["Analytics and advertising cookies, ad conversion measurement", "Consent (KVKK 5/1; GDPR 6(1)(a)) — you can withdraw it at any time"],
                    ["Responding to legal claims and disputes", "Establishing, exercising or defending legal claims; legal obligation (KVKK 5/2-e, 5/2-ç)"],
                  ],
                },
              },
              { p: "We do not send marketing emails. If we ever do, it will only be with your separate opt-in and every message will include an unsubscribe link." },
            ],
          },
          {
            id: "collection",
            h: "4. How we collect data",
            blocks: [
              { p: "We collect personal data through the website and Studio forms, API and integration requests, cookies and similar technologies, and notifications from our payment provider, partly or fully by automated means." },
            ],
          },
          {
            id: "recipients",
            h: "5. Who we share data with",
            blocks: [
              { p: "We share personal data only with the service providers below, and only as far as needed to run the Service:" },
              {
                table: {
                  head: ["Provider", "Purpose", "Location"],
                  rows: [
                    ["Cloudflare, Inc.", "Hosting, content delivery, security, rate limiting", "USA / global network"],
                    ["Supabase, Inc.", "Database and authentication", "US company; server region per project settings"],
                    ["Anthropic, PBC", "AI processing (Claude)", "USA"],
                    ["Resend, Inc.", "Transactional email delivery", "USA"],
                    ["Lemon Squeezy (Link, LLC)", "Payments, subscriptions, invoicing and tax (merchant of record — processes payment data as an independent controller under its own policy)", "USA"],
                    ["Google LLC / Google Ireland Ltd.", "Analytics and ad measurement (only with your consent)", "USA / EU"],
                    ["Meta Platforms Ireland Ltd.", "Ad measurement (only with your consent)", "EU / USA"],
                  ],
                },
              },
              { p: "Otherwise we only disclose personal data to competent public authorities when legally required." },
            ],
          },
          {
            id: "transfers",
            h: "6. International transfers",
            blocks: [
              { p: "Because the providers above run servers outside Türkiye (mainly in the USA and the EU), your personal data is transferred abroad. These transfers are made in line with the transfer rules of KVKK Article 9 and the GDPR, relying on safeguards such as the providers' data processing agreements and standard contractual clauses." },
            ],
          },
          {
            id: "retention",
            h: "7. How long we keep data",
            blocks: [
              {
                ul: [
                  "Account and content data: while your account is open. When you close it, the data is deleted or anonymised within 30 days; removal from backups can take up to 30 more days.",
                  "Share pages: until you remove them or your account is deleted.",
                  "AI usage records: linked to your account while it is open; after closure they are kept only as anonymous statistics.",
                  "IP address: up to 48 hours for rate limiting and security; in usage statistics only as an irreversible hash, for up to 12 months.",
                  "Payment and invoice records: for the period required by tax and commercial law (generally 10 years in Türkiye). Lemon Squeezy is the primary holder of invoice records.",
                  "Support correspondence: up to 2 years after the request is resolved.",
                  "Cookies: as listed in the [Cookie Policy](/legal/cookies).",
                ],
              },
            ],
          },
          {
            id: "security",
            h: "8. Security",
            blocks: [
              { p: "Data is encrypted in transit with TLS. The database enforces row-level security so each user can only reach their own data. Passwords are stored only as hashes and administrative access follows the principle of least privilege. No system is 100% secure; if a data breach occurs we will notify the Turkish Personal Data Protection Board and affected people as the law requires." },
            ],
          },
          {
            id: "rights",
            h: "9. Your rights",
            blocks: [
              { p: "Under KVKK Article 11 you have the right to:" },
              {
                ul: [
                  "learn whether your personal data is processed and, if so, request information about it",
                  "learn the purpose of processing and whether data is used accordingly",
                  "know the third parties in Türkiye or abroad to whom data is transferred",
                  "ask for incomplete or inaccurate data to be corrected, for data to be erased or destroyed under KVKK Article 7, and for these actions to be notified to the recipients",
                  "object to an outcome against you that results exclusively from automated analysis",
                  "claim compensation if you suffer damage from unlawful processing",
                ],
              },
              { p: "If you are in the EU/EEA, the GDPR also gives you the rights to data portability, restriction of processing, objection, and to lodge a complaint with the supervisory authority in your country. Where processing is based on consent you can withdraw it at any time; you can change your cookie choices on the [Cookie Policy](/legal/cookies) page." },
            ],
          },
          {
            id: "requests",
            h: "10. How to make a request",
            blocks: [
              { p: `Write to ${mail(i)} from the email address registered in our system. We may ask for extra information to verify your identity. We will answer free of charge within 30 days at the latest; if the request involves a separate cost, the fee set by the Board may be charged. If you are not satisfied with our answer you can complain to the Turkish Personal Data Protection Board (or, in the EU/EEA, your local supervisory authority).` },
            ],
          },
          {
            id: "automated",
            h: "11. Automated decisions",
            blocks: [{ p: "We do not make decisions with legal effects about you based solely on automated processing. Technical controls such as usage limits are applied automatically." }],
          },
          {
            id: "children",
            h: "12. Children",
            blocks: [{ p: "The Service is not directed at children under 16 and we do not knowingly collect personal data from them." }],
          },
          {
            id: "changes",
            h: "13. Changes",
            blocks: [{ p: "We may update this policy and will announce material changes on the site. The current version is always on this page." }],
          },
        ],
      };

    case "cookies":
      return {
        slug,
        title: "Cookie Policy",
        short: "Cookies",
        description: "Which cookies Prompt.Monster uses, why and for how long, and how to manage your cookie choices.",
        intro: [
          "Cookies are small text files stored by your browser when you visit a website. By default Prompt.Monster only uses cookies that are needed for the Service to work. Analytics and advertising cookies are only enabled with your consent, which you can withdraw at any time.",
          i.tracking ? "You can change your choices at any time with the button below." : "**No analytics or advertising tags are active on the site right now; only strictly necessary cookies are used.** If such tags are enabled in the future, you will see a banner asking for your consent first.",
        ],
        sections: [
          {
            id: "necessary",
            h: "1. Strictly necessary cookies and browser storage",
            blocks: [
              { p: "These are needed for the Service to work, stay secure, or deliver something you explicitly asked for, and do not require consent." },
              {
                table: {
                  head: ["Name", "Purpose", "Duration"],
                  rows: [
                    ["sb-…-auth-token", "Keeps you signed in (Supabase authentication)", "Until you sign out, max. 400 days"],
                    ["pm_consent", "Remembers your cookie choices", "6 months"],
                    ["pm_lang", "Remembers your language choice (if you use the language switch)", "1 year"],
                    ["pm_code", "Carries the discount code from a discount link to checkout", "30 days"],
                    ["pm_src", "Records which campaign link you arrived from (e.g. utm_source); contains no personal data, used only for aggregate channel statistics and never shared with third parties", "90 days"],
                    ["__cf_bm, cf_clearance", "Cloudflare bot protection and security (when needed)", "30 minutes – 1 year"],
                    ["localStorage: prompt-monster:studio:v1", "Keeps your Studio draft in your browser (not sent to our servers)", "Until you clear it"],
                    ["sessionStorage: pm:notice:dismissed", "Keeps an announcement you closed hidden", "Until the tab is closed"],
                  ],
                },
              },
            ],
          },
          {
            id: "analytics",
            h: "2. Analytics cookies (consent required)",
            blocks: [
              {
                table: {
                  head: ["Name", "Provider and purpose", "Duration"],
                  rows: [["_ga, _ga_<ID>", "Google Analytics 4 — visit and usage statistics (IP anonymisation on)", "2 years"]],
                },
              },
            ],
          },
          {
            id: "advertising",
            h: "3. Advertising cookies (consent required)",
            blocks: [
              {
                table: {
                  head: ["Name", "Provider and purpose", "Duration"],
                  rows: [
                    ["_gcl_au, _gcl_aw", "Google Ads — measuring sign-ups and purchases from ads", "90 days"],
                    ["_fbp, _fbc", "Meta Pixel — measuring sign-ups and purchases from ads", "90 days"],
                  ],
                },
              },
            ],
          },
          {
            id: "manage",
            h: "4. Managing your choices",
            blocks: [
              { p: "On your first visit the banner lets you choose \"Accept all\", \"Reject\" or \"Preferences\". You can change your decision at any time; when you withdraw consent we delete the related cookies from your browser. You can also delete or block cookies in your browser settings; blocking strictly necessary cookies may stop features such as signing in from working." },
              { cookieButton: true },
            ],
          },
          {
            id: "third-parties",
            h: "5. Third-party policies",
            blocks: [
              {
                ul: [
                  "[Google Privacy Policy](https://policies.google.com/privacy)",
                  "[Meta Privacy Policy](https://www.facebook.com/privacy/policy/)",
                  "[Cloudflare Cookie Policy](https://www.cloudflare.com/cookie-policy/)",
                  "[Supabase Privacy Policy](https://supabase.com/privacy)",
                ],
              },
              { p: `For details on how personal data is processed see our [Privacy Policy](/legal/privacy), or send questions to ${mail(i)}.` },
            ],
          },
        ],
      };

    case "refund":
      return {
        slug,
        title: "Refund Policy",
        short: "Refunds",
        description: "14-day no-questions-asked refund for Monster Pro, renewal refunds, cancelling and how to request a refund.",
        intro: ["We want you to try Monster Pro without risk. This policy covers Pro subscriptions bought through Lemon Squeezy."],
        sections: [
          {
            id: "14-days",
            h: "1. 14-day no-questions-asked refund",
            blocks: [{ p: "You can ask for a full refund **within 14 days** of your first Pro purchase (monthly or yearly), no reason needed." }],
          },
          {
            id: "renewals",
            h: "2. Renewals",
            blocks: [
              {
                ul: [
                  "Your subscription renews automatically at the end of each period unless you cancel; you can cancel any time before the renewal.",
                  "You can ask for a renewal charge to be refunded within 7 days of the renewal date if you have not used Pro AI features in that period.",
                  "Otherwise we do not give partial-period refunds. When you cancel, Pro stays active until the end of the period you paid for.",
                ],
              },
            ],
          },
          {
            id: "how",
            h: "3. How to request a refund",
            blocks: [
              { p: `Email ${mail(i)} from the address you used at checkout and include your order number (it is on your Lemon Squeezy receipt). We approve eligible requests within 3 business days. Lemon Squeezy returns the money to your original payment method; depending on your bank it can take 5–10 business days to appear.` },
            ],
          },
          {
            id: "cancel",
            h: "4. Cancelling your subscription",
            blocks: [
              { p: "Use the \"Manage subscription\" link on the [Pricing](/pricing) page (Lemon Squeezy customer portal) or the link in your payment email to cancel, update your card or download invoices. You can also ask us to cancel it for you." },
            ],
          },
          {
            id: "abuse",
            h: "5. Abuse",
            blocks: [
              { p: "We may refuse refunds and close accounts in cases of repeated refund requests, abuse or suspected fraud. Lemon Squeezy's buyer terms also apply." },
            ],
          },
          {
            id: "statutory",
            h: "6. Your statutory rights",
            blocks: [
              { p: "This policy does not limit your statutory consumer rights. Because the Service is digital content that starts being delivered as soon as you buy it, the statutory right of withdrawal may be limited (e.g. Turkish Distance Contracts Regulation Art. 15/1-ğ, or the EU digital content rules); we still honour the 14-day no-questions-asked refund above." },
              { p: "The Free plan is free of charge, so refunds do not apply to it." },
            ],
          },
        ],
      };
  }
}
