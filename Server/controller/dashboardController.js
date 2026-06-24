const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const FALLBACK_DATA = {
  problems: [
    {
      en: "Domestic violence and lack of immediate legal protection",
      hi: "घरेलू हिंसा और तत्काल कानूनी सुरक्षा की कमी",
      link: "https://wcd.nic.in/"
    },
    {
      en: "Workplace discrimination and unequal pay",
      hi: "कार्यस्थल पर भेदभाव और असमान वेतन",
      link: "https://wcd.nic.in/"
    },
    {
      en: "Online harassment, cyberstalking and digital safety concerns",
      hi: "ऑनलाइन उत्पीड़न, साइबर स्टॉकिंग और डिजिटल सुरक्षा चिंताएं",
      link: "https://ncw.nic.in/"
    },
    {
      en: "Lack of awareness about inheritance and property rights",
      hi: "विरासत और संपत्ति के अधिकारों के बारे में जागरूकता की कमी",
      link: "https://nalsa.gov.in/"
    },
    {
      en: "Difficulty in accessing free legal aid services",
      hi: "मुफ्त कानूनी सहायता सेवाओं तक पहुंचने में कठिनाई",
      link: "https://nalsa.gov.in/"
    },
    {
      en: "Dowry harassment and social pressure",
      hi: "दहेज उत्पीड़न और सामाजिक दबाव",
      link: "https://ncw.nic.in/"
    },
    {
      en: "Inadequate maternity benefits and support at work",
      hi: "कार्यस्थल पर अपर्याप्त मातृत्व लाभ और सहायता",
      link: "https://wcd.nic.in/"
    },
    {
      en: "Stigma around reporting sexual harassment",
      hi: "यौन उत्पीड़न की रिपोर्टिंग के आसपास कलंक",
      link: "https://ncw.nic.in/"
    },
    {
      en: "Underrepresentation in local governance and decision-making",
      hi: "स्थानीय शासन और निर्णय लेने में कम प्रतिनिधित्व",
      link: "https://wcd.nic.in/"
    },
    {
      en: "Challenges in claiming maintenance after separation",
      hi: "अलगाव के बाद रखरखाव का दावा करने में चुनौतियाँ",
      link: "https://nalsa.gov.in/"
    }
  ],
  rights: [
    {
      en: "Right to free legal aid under Section 12 of LSA Act",
      hi: "कानूनी सेवा प्राधिकरण अधिनियम की धारा 12 के तहत मुफ्त कानूनी सहायता का अधिकार",
      link: "https://nalsa.gov.in/"
    },
    {
      en: "Right to file Zero FIR at any police station",
      hi: "किसी भी पुलिस स्टेशन में जीरो एफआईआर दर्ज करने का अधिकार",
      link: "https://ncw.nic.in/"
    },
    {
      en: "Protection under Domestic Violence Act, 2005",
      hi: "घरेलू हिंसा अधिनियम, 2005 के तहत संरक्षण",
      link: "https://wcd.nic.in/"
    },
    {
      en: "Equal right to parental property under Hindu Succession Act",
      hi: "हिंदू उत्तराधिकार अधिनियम के तहत माता-पिता की संपत्ति में समान अधिकार",
      link: "https://nalsa.gov.in/"
    },
    {
      en: "Protection from Sexual Harassment at Workplace (POSH Act)",
      hi: "कार्यस्थल पर यौन उत्पीड़न से सुरक्षा (पॉश अधिनियम)",
      link: "https://wcd.nic.in/"
    },
    {
      en: "Right to virtual police station reporting and digital FIRs",
      hi: "आभासी पुलिस स्टेशन रिपोर्टिंग और डिजिटल एफआईआर का अधिकार",
      link: "https://ncw.nic.in/"
    },
    {
      en: "Right to privacy and confidentiality during investigation",
      hi: "जांच के दौरान गोपनीयता का अधिकार",
      link: "https://nalsa.gov.in/"
    },
    {
      en: "Maternity benefits and paid leave under Maternity Benefit Act",
      hi: "मातृत्व लाभ अधिनियम के तहत मातृत्व लाभ और सवैतनिक अवकाश",
      link: "https://wcd.nic.in/"
    },
    {
      en: "Equal Remuneration Act guaranteeing equal pay for equal work",
      hi: "समान काम के लिए समान वेतन की गारंटी देने वाला समान पारिश्रमिक अधिनियम",
      link: "https://wcd.nic.in/"
    },
    {
      en: "Right to shelter homes and rehabilitation services",
      hi: "आश्रय गृहों और पुनर्वास सेवाओं का अधिकार",
      link: "https://wcd.nic.in/"
    }
  ]
};

exports.getDemographicInsights = async (req, res) => {
  try {
    const { age, state } = req.user || {};
    if (!age || !state) {
      return res.status(400).json({
        success: false,
        message: "User age and state are required for dashboard insights",
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY missing, using high-quality static fallback insights");
      return res.json({
        success: true,
        ...FALLBACK_DATA
      });
    }

    const prompt = `
Generate a JSON object for a female user in India. Age: ${age}, State: ${state}.
The JSON must have exactly two keys: "problems" and "rights".

1. "problems": An array of exactly 10 common legal/social issues faced by women of this age in this state.
   Each item must be an object with:
   - "en" (English text, short phrase)
   - "hi" (Hindi translation)
   - "link" (a relevant official URL about this problem – use government/legal aid sites like wcd.nic.in, nalsa.gov.in, ncw.nic.in, or state-specific women commission sites)

2. "rights": An array of exactly 10 legal rights relevant to women in this state.
   Each item must be an object with:
   - "en" (English text, short phrase)
   - "hi" (Hindi translation)
   - "link" (a relevant official URL about this right – use wcd.nic.in, nalsa.gov.in, or similar)

Use real, working URLs where possible. Return ONLY the JSON object – no markdown, no code blocks, just valid JSON.
`;

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.6,
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Gemini API error, falling back to static insights. Status:", response.status, errBody);
      return res.json({
        success: true,
        ...FALLBACK_DATA
      });
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error("Invalid response from Gemini service, using static fallback");
      return res.json({
        success: true,
        ...FALLBACK_DATA
      });
    }

    let cleanedText = text.trim();
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/, "")
        .replace(/```\s*$/, "")
        .trim();
    }

    const parsed = JSON.parse(cleanedText);
    if (!Array.isArray(parsed.problems) || !Array.isArray(parsed.rights)) {
      console.error("Invalid insights structure from Gemini, using static fallback");
      return res.json({
        success: true,
        ...FALLBACK_DATA
      });
    }

    const problems = parsed.problems.slice(0, 10).map((item) => ({
      en: item.en || "",
      hi: item.hi || item.en || "",
      link: item.link || "https://wcd.nic.in/",
    }));

    const rights = parsed.rights.slice(0, 10).map((item) => ({
      en: item.en || "",
      hi: item.hi || item.en || "",
      link: item.link || "https://nalsa.gov.in/",
    }));

    return res.json({
      success: true,
      problems,
      rights,
    });
  } catch (error) {
    console.error("Dashboard getDemographicInsights error, falling back to static insights:", error);
    return res.json({
      success: true,
      ...FALLBACK_DATA
    });
  }
};
