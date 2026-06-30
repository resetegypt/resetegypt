// ============================================================================
// templates.ts — bibliothèque de templates pour les workflows automation.
//
// Chaque template a 3 langues (fr/en/ar) et accepte des variables typées.
// Pour ajouter un template : ajoute une entrée dans TEMPLATES + sa traduction.
// ============================================================================

interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

type Lang = 'fr' | 'en' | 'ar';

interface TemplateDef {
  fr: (v: Record<string, string>) => RenderedEmail;
  en: (v: Record<string, string>) => RenderedEmail;
  ar: (v: Record<string, string>) => RenderedEmail;
}

/** Échappe les variables avant interpolation HTML — patient nommé `<img onerror=...>` = XSS sinon. */
function esc(s: string | undefined): string {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Échappe toutes les valeurs d'un dict de variables. Le texte plain reste brut. */
function escVars(v: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of Object.keys(v)) out[k] = esc(v[k]);
  return out;
}

const wrap = (innerHtml: string, lang: Lang): string => `
<!doctype html>
<html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a;line-height:1.5">
  <div style="border-bottom:2px solid #4f46e5;padding-bottom:16px;margin-bottom:24px">
    <strong style="font-size:18px;color:#4f46e5">Reset Egypt</strong><br/>
    <span style="font-size:13px;color:#666">Centre d'auriculothérapie laser — Le Caire</span>
  </div>
  ${innerHtml}
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#888">
    Reset Egypt · N Teseen, New Cairo · +20 1XXXXXXXXX · <a href="https://reset-egypt.com" style="color:#4f46e5">reset-egypt.com</a>
  </div>
</body>
</html>`;

const TEMPLATES: Record<string, TemplateDef> = {
  reminder_j2: {
    fr: (v) => ({
      subject: `Rappel : votre RDV chez Reset Egypt dans 2 jours`,
      text: `Bonjour ${v.patientFirstName},\n\nNous vous rappelons votre RDV chez Reset Egypt le ${v.appointmentDate} à ${v.appointmentTime} avec ${v.practitionerName}.\n\nÀ très bientôt,\nL'équipe Reset Egypt`,
      html: wrap(`<p>Bonjour <strong>${v.patientFirstName}</strong>,</p><p>Nous vous rappelons votre RDV chez Reset Egypt le <strong>${v.appointmentDate}</strong> à <strong>${v.appointmentTime}</strong> avec ${v.practitionerName}.</p><p>À très bientôt,<br/>L'équipe Reset Egypt</p>`, 'fr'),
    }),
    en: (v) => ({
      subject: `Reminder: your Reset Egypt appointment in 2 days`,
      text: `Hello ${v.patientFirstName},\n\nThis is a reminder of your Reset Egypt appointment on ${v.appointmentDate} at ${v.appointmentTime} with ${v.practitionerName}.\n\nSee you soon,\nReset Egypt team`,
      html: wrap(`<p>Hello <strong>${v.patientFirstName}</strong>,</p><p>This is a reminder of your Reset Egypt appointment on <strong>${v.appointmentDate}</strong> at <strong>${v.appointmentTime}</strong> with ${v.practitionerName}.</p><p>See you soon,<br/>Reset Egypt team</p>`, 'en'),
    }),
    ar: (v) => ({
      subject: `تذكير: موعدك في ريسيت إيجبت بعد يومين`,
      text: `مرحبا ${v.patientFirstName}،\n\nنذكركم بموعدكم في ريسيت إيجبت يوم ${v.appointmentDate} في الساعة ${v.appointmentTime} مع ${v.practitionerName}.\n\nنراكم قريبا،\nفريق ريسيت إيجبت`,
      html: wrap(`<p>مرحبا <strong>${v.patientFirstName}</strong>،</p><p>نذكركم بموعدكم في ريسيت إيجبت يوم <strong>${v.appointmentDate}</strong> في الساعة <strong>${v.appointmentTime}</strong> مع ${v.practitionerName}.</p><p>نراكم قريبا،<br/>فريق ريسيت إيجبت</p>`, 'ar'),
    }),
  },

  confirmation_j1: {
    fr: (v) => ({
      subject: `Demain : votre séance chez Reset Egypt à ${v.appointmentTime}`,
      text: `Bonjour ${v.patientFirstName},\n\nVotre séance est confirmée demain ${v.appointmentDate} à ${v.appointmentTime} avec ${v.practitionerName}.\n\nMerci de répondre à ce mail si vous devez modifier l'horaire.\n\nReset Egypt`,
      html: wrap(`<p>Bonjour <strong>${v.patientFirstName}</strong>,</p><p>Votre séance est <strong>confirmée demain ${v.appointmentDate} à ${v.appointmentTime}</strong> avec ${v.practitionerName}.</p><p>Merci de répondre à ce mail si vous devez modifier l'horaire.</p><p>Reset Egypt</p>`, 'fr'),
    }),
    en: (v) => ({
      subject: `Tomorrow: your Reset Egypt session at ${v.appointmentTime}`,
      text: `Hello ${v.patientFirstName},\n\nYour session is confirmed tomorrow ${v.appointmentDate} at ${v.appointmentTime} with ${v.practitionerName}.\n\nReply to this email if you need to reschedule.\n\nReset Egypt`,
      html: wrap(`<p>Hello <strong>${v.patientFirstName}</strong>,</p><p>Your session is <strong>confirmed tomorrow ${v.appointmentDate} at ${v.appointmentTime}</strong> with ${v.practitionerName}.</p><p>Reply to this email if you need to reschedule.</p><p>Reset Egypt</p>`, 'en'),
    }),
    ar: (v) => ({
      subject: `غدا: جلستك في ريسيت إيجبت الساعة ${v.appointmentTime}`,
      text: `مرحبا ${v.patientFirstName}،\n\nموعدك مؤكد غدا ${v.appointmentDate} الساعة ${v.appointmentTime} مع ${v.practitionerName}.\n\nردوا على هذا البريد إذا أردتم تغيير الموعد.\n\nريسيت إيجبت`,
      html: wrap(`<p>مرحبا <strong>${v.patientFirstName}</strong>،</p><p>موعدك <strong>مؤكد غدا ${v.appointmentDate} الساعة ${v.appointmentTime}</strong> مع ${v.practitionerName}.</p><p>ردوا على هذا البريد إذا أردتم تغيير الموعد.</p><p>ريسيت إيجبت</p>`, 'ar'),
    }),
  },

  welcome_j0: {
    fr: (v) => ({
      subject: `À tout à l'heure chez Reset Egypt`,
      text: `Bonjour ${v.patientFirstName},\n\nVotre RDV est confirmé aujourd'hui avec ${v.practitionerName}.\n\nN Teseen, New Cairo (à proximité de la CMC). Parking sur place.\n\nÀ tout à l'heure !`,
      html: wrap(`<p>Bonjour <strong>${v.patientFirstName}</strong>,</p><p>Votre RDV est <strong>dans ~2h</strong> avec ${v.practitionerName}.</p><p>📍 <em>N Teseen, New Cairo (à proximité de la CMC). Parking sur place.</em></p><p>À tout à l'heure !</p>`, 'fr'),
    }),
    en: (v) => ({
      subject: `See you soon at Reset Egypt`,
      text: `Hello ${v.patientFirstName},\n\nYour appointment is confirmed today with ${v.practitionerName}.\n\nN Teseen, New Cairo (near CMC). Parking available.\n\nSee you soon!`,
      html: wrap(`<p>Hello <strong>${v.patientFirstName}</strong>,</p><p>Your appointment is <strong>in ~2h</strong> with ${v.practitionerName}.</p><p>📍 <em>N Teseen, New Cairo (near CMC). Parking available.</em></p><p>See you soon!</p>`, 'en'),
    }),
    ar: (v) => ({
      subject: `نراك قريبا في ريسيت إيجبت`,
      text: `مرحبا ${v.patientFirstName}،\n\nموعدك مؤكد اليوم مع ${v.practitionerName}.\n\nN Teseen، New Cairo (بالقرب من CMC). يوجد موقف سيارات.\n\nنراك قريبا!`,
      html: wrap(`<p>مرحبا <strong>${v.patientFirstName}</strong>،</p><p>موعدك <strong>بعد ~ساعتين</strong> مع ${v.practitionerName}.</p><p>📍 <em>N Teseen، New Cairo (بالقرب من CMC). يوجد موقف سيارات.</em></p><p>نراك قريبا!</p>`, 'ar'),
    }),
  },

  thanks_j1: {
    fr: (v) => ({
      subject: `Merci pour votre séance d'hier`,
      text: `Bonjour ${v.patientFirstName},\n\nMerci pour votre confiance hier. Comment vous sentez-vous aujourd'hui ?\n\nN'hésitez pas à nous répondre, votre praticien lit chaque message.\n\nReset Egypt`,
      html: wrap(`<p>Bonjour <strong>${v.patientFirstName}</strong>,</p><p>Merci pour votre confiance hier. Comment vous sentez-vous aujourd'hui ?</p><p>N'hésitez pas à répondre à ce mail — votre praticien lit chaque message.</p><p>Reset Egypt</p>`, 'fr'),
    }),
    en: (v) => ({
      subject: `Thank you for your session yesterday`,
      text: `Hello ${v.patientFirstName},\n\nThank you for your trust yesterday. How are you feeling today?\n\nFeel free to reply, your practitioner reads every message.\n\nReset Egypt`,
      html: wrap(`<p>Hello <strong>${v.patientFirstName}</strong>,</p><p>Thank you for your trust yesterday. How are you feeling today?</p><p>Feel free to reply — your practitioner reads every message.</p><p>Reset Egypt</p>`, 'en'),
    }),
    ar: (v) => ({
      subject: `شكرا على جلستك أمس`,
      text: `مرحبا ${v.patientFirstName}،\n\nشكرا على ثقتك أمس. كيف تشعر اليوم؟\n\nلا تتردد في الرد، طبيبك يقرأ كل رسالة.\n\nريسيت إيجبت`,
      html: wrap(`<p>مرحبا <strong>${v.patientFirstName}</strong>،</p><p>شكرا على ثقتك أمس. كيف تشعر اليوم؟</p><p>لا تتردد في الرد — طبيبك يقرأ كل رسالة.</p><p>ريسيت إيجبت</p>`, 'ar'),
    }),
  },

  review_request: {
    fr: (v) => ({
      subject: `Votre avis nous intéresse`,
      text: `Bonjour ${v.patientFirstName},\n\nSi votre expérience chez Reset Egypt vous a plu, votre avis Google nous aide énormément.\n\n👉 https://g.page/r/reset-egypt/review\n\nMerci !`,
      html: wrap(`<p>Bonjour <strong>${v.patientFirstName}</strong>,</p><p>Si votre expérience chez Reset Egypt vous a plu, votre avis Google nous aide énormément.</p><p><a href="https://g.page/r/reset-egypt/review" style="display:inline-block;padding:10px 16px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px">⭐ Laisser un avis</a></p><p>Merci !</p>`, 'fr'),
    }),
    en: (v) => ({
      subject: `We'd love your feedback`,
      text: `Hello ${v.patientFirstName},\n\nIf you enjoyed your Reset Egypt experience, your Google review really helps us.\n\n👉 https://g.page/r/reset-egypt/review\n\nThank you!`,
      html: wrap(`<p>Hello <strong>${v.patientFirstName}</strong>,</p><p>If you enjoyed your Reset Egypt experience, your Google review really helps us.</p><p><a href="https://g.page/r/reset-egypt/review" style="display:inline-block;padding:10px 16px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px">⭐ Leave a review</a></p><p>Thank you!</p>`, 'en'),
    }),
    ar: (v) => ({
      subject: `رأيك يهمنا`,
      text: `مرحبا ${v.patientFirstName}،\n\nإذا أعجبتك تجربتك في ريسيت إيجبت، رأيك في جوجل يساعدنا كثيرا.\n\n👉 https://g.page/r/reset-egypt/review\n\nشكرا!`,
      html: wrap(`<p>مرحبا <strong>${v.patientFirstName}</strong>،</p><p>إذا أعجبتك تجربتك في ريسيت إيجبت، رأيك في جوجل يساعدنا كثيرا.</p><p><a href="https://g.page/r/reset-egypt/review" style="display:inline-block;padding:10px 16px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px">⭐ اترك تقييما</a></p><p>شكرا!</p>`, 'ar'),
    }),
  },

  birthday: {
    fr: (v) => ({
      subject: `Joyeux anniversaire ${v.patientFirstName} !`,
      text: `Bonjour ${v.patientFirstName},\n\nToute l'équipe Reset Egypt vous souhaite un très bel anniversaire 🎉\n\nReset Egypt`,
      html: wrap(`<p>Bonjour <strong>${v.patientFirstName}</strong>,</p><p>Toute l'équipe Reset Egypt vous souhaite un très bel anniversaire 🎉</p><p>Reset Egypt</p>`, 'fr'),
    }),
    en: (v) => ({
      subject: `Happy birthday ${v.patientFirstName}!`,
      text: `Hello ${v.patientFirstName},\n\nThe entire Reset Egypt team wishes you a wonderful birthday 🎉\n\nReset Egypt`,
      html: wrap(`<p>Hello <strong>${v.patientFirstName}</strong>,</p><p>The entire Reset Egypt team wishes you a wonderful birthday 🎉</p><p>Reset Egypt</p>`, 'en'),
    }),
    ar: (v) => ({
      subject: `عيد ميلاد سعيد ${v.patientFirstName}!`,
      text: `مرحبا ${v.patientFirstName}،\n\nفريق ريسيت إيجبت بأكمله يتمنى لك عيد ميلاد رائع 🎉\n\nريسيت إيجبت`,
      html: wrap(`<p>مرحبا <strong>${v.patientFirstName}</strong>،</p><p>فريق ريسيت إيجبت بأكمله يتمنى لك عيد ميلاد رائع 🎉</p><p>ريسيت إيجبت</p>`, 'ar'),
    }),
  },

  reactivation: {
    fr: (v) => ({
      subject: `Cela fait longtemps ${v.patientFirstName}...`,
      text: `Bonjour ${v.patientFirstName},\n\nNous n'avons pas eu le plaisir de vous revoir depuis 2 mois.\n\nSi vous souhaitez reprendre rendez-vous, c'est ici : https://book.reset-egypt.com\n\nReset Egypt`,
      html: wrap(`<p>Bonjour <strong>${v.patientFirstName}</strong>,</p><p>Nous n'avons pas eu le plaisir de vous revoir depuis 2 mois.</p><p><a href="https://book.reset-egypt.com" style="display:inline-block;padding:10px 16px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px">📅 Reprendre rendez-vous</a></p><p>Reset Egypt</p>`, 'fr'),
    }),
    en: (v) => ({
      subject: `It's been a while ${v.patientFirstName}...`,
      text: `Hello ${v.patientFirstName},\n\nIt's been 2 months since we saw you.\n\nIf you'd like to book a session: https://book.reset-egypt.com\n\nReset Egypt`,
      html: wrap(`<p>Hello <strong>${v.patientFirstName}</strong>,</p><p>It's been 2 months since we saw you.</p><p><a href="https://book.reset-egypt.com" style="display:inline-block;padding:10px 16px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px">📅 Book a session</a></p><p>Reset Egypt</p>`, 'en'),
    }),
    ar: (v) => ({
      subject: `مر وقت طويل ${v.patientFirstName}...`,
      text: `مرحبا ${v.patientFirstName}،\n\nمر شهران منذ آخر زيارة لك.\n\nإذا أردت حجز موعد: https://book.reset-egypt.com\n\nريسيت إيجبت`,
      html: wrap(`<p>مرحبا <strong>${v.patientFirstName}</strong>،</p><p>مر شهران منذ آخر زيارة لك.</p><p><a href="https://book.reset-egypt.com" style="display:inline-block;padding:10px 16px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px">📅 حجز موعد</a></p><p>ريسيت إيجبت</p>`, 'ar'),
    }),
  },
};

export function renderTemplate(name: string, vars: Record<string, string>): RenderedEmail {
  const lang = (vars.language as Lang) || 'fr';
  const tpl = TEMPLATES[name];
  if (!tpl) {
    return {
      subject: `Reset Egypt`,
      text: `Bonjour ${vars.patientFirstName ?? ''}\n\n(template "${name}" introuvable)\n\nReset Egypt`,
      html: wrap(
        `<p>Bonjour <strong>${esc(vars.patientFirstName)}</strong></p><p>(template <code>${esc(name)}</code> introuvable)</p>`,
        lang,
      ),
    };
  }
  const renderer = tpl[lang] ?? tpl.fr;
  // Anti-XSS : on rend une 1re fois avec variables RAW (subject + text) puis
  // une 2e fois avec variables ESCAPED pour la partie HTML.
  // Coût : 2× le rendering, négligeable. Bénéfice : un patient nommé
  // `<img src=x onerror=alert(1)>` ne crée plus d'injection dans les emails.
  const raw = renderer(vars);
  const escaped = renderer(escVars(vars));
  return {
    subject: raw.subject,
    text: raw.text,
    html: escaped.html,
  };
}

