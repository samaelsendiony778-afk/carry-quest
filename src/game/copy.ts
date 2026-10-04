export type Lang = "ar" | "en";

export function messages(lang: Lang) {
  const ar = lang === "ar";
  return {
    school: ar ? "معالم التربية الأهلية" : "Maalem Al Tarbeiah",
    grade: ar ? "الصف الرابع · الوحدة 2" : "Grade 4 · Unit 2",
    title: ar ? "حمل العشرة" : "Carry Quest",
    subtitle: ar
      ? "ضرب عدد من رقمين في رقم واحد، مع إعادة التجميع."
      : "Multiply a 2-digit number by 1 digit, with regrouping.",
    learn: ar ? "تعلّم" : "Learn",
    practice: ar ? "تدرّب" : "Practice",
    challenge: ar ? "تحدّي" : "Challenge",
    learnBlurb: ar ? "مثال الدرس 43 × 6، خطوة بخطوة." : "Lesson example 43 × 6, step by step.",
    practiceBlurb: ar ? "مسائل ورقة العمل الستة." : "The six worksheet problems.",
    challengeBlurb: ar ? "8 مسائل جديدة. عندك 3 محاولات." : "8 new problems. 3 tries.",
    how: ar ? "طريقة الدرس" : "The lesson steps",
    s1: ar ? "رتّب الخانات" : "Line up the places",
    s2: ar ? "اضرب الآحاد واحمل" : "Multiply the ones and carry",
    s3: ar ? "اضرب العشرات وأضف الحمل" : "Tens, then add the carry",
    back: ar ? "رجوع" : "Back",
    check: ar ? "تحقّق" : "Check",
    help: ar ? "مساعدة" : "Hint",
    why: ar ? "ليه بنحمل؟" : "Why carry?",
    hideWhy: ar ? "إخفاء" : "Hide",
    next: ar ? "التالي" : "Next",
    linedUp: ar ? "الأرقام مرتّبة" : "Digits are lined up",
    again: ar ? "مرة ثانية" : "Play again",
    home: ar ? "القائمة" : "Home",
    toPractice: ar ? "يلا نتدرّب" : "Let's practice",
    toChallenge: ar ? "يلا التحدّي" : "Start the challenge",
    stars: ar ? "النجوم" : "Stars",
    best: ar ? "أفضل نتيجة" : "Best score",
    combo: ar ? "سلسلة" : "Streak",
    score: ar ? "النقاط" : "Score",
    mute: ar ? "كتم الصوت" : "Mute",
    soundOn: ar ? "تشغيل الصوت" : "Sound on",
    hundreds: ar ? "مئات" : "Hundreds",
    tens: ar ? "عشرات" : "Tens",
    ones: ar ? "آحاد" : "Ones",
    carry: ar ? "حمل" : "Carry",
    pick: ar ? "اختر الرقم، ثم اضغط خانته." : "Tap a digit, then tap its place.",
    mascotAlt: ar ? "ثعلب يحمل رمز الحمل" : "Fox holding the carry token",
    learned: ar ? "خلّصت مثال الدرس" : "Lesson example done",
    review: ar ? "ورقة العمل" : "Worksheet",
    solved: ar ? "مسائل صحيحة" : "Solved",
    of: (i: number, n: number) => (ar ? `${i} من ${n}` : `${i} of ${n}`),
    arrange: ar
      ? "رتّب الأرقام في أعمدة حسب الخانة: الآحاد تحت الآحاد، والعشرات تحت العشرات."
      : "Arrange the digits in columns by place value: ones under ones, tens under tens.",
    onesPrompt: (ones: number, m: number) =>
      ar ? `اضرب الآحاد: ${ones} × ${m}` : `Multiply the ones digit: ${ones} × ${m}`,
    placePrompt: (prod: number, carry: number, digit: number) =>
      ar
        ? `${prod} فيها ${carry} عشرات و ${digit} آحاد. اكتب ${digit} وانقل ${carry} فوق العشرات.`
        : `${prod} is ${carry} ten${carry === 1 ? "" : "s"} and ${digit} one${digit === 1 ? "" : "s"}. Write ${digit} and carry ${carry}.`,
    tensPrompt: (tens: number, m: number, carry: number) =>
      ar
        ? `اضرب العشرات وأضف الحمل: ${tens} × ${m} + ${carry}`
        : `Multiply the tens and add the carry: ${tens} × ${m} + ${carry}`,
    success: (n: number, m: number, answer: number) =>
      ar ? `أحسنت! ${n} × ${m} = ${answer}` : `Nice! So, ${n} × ${m} = ${answer}.`,
    onesWrong: (ones: number, m: number, prod: number, reveal: boolean) =>
      reveal
        ? ar
          ? `${ones} × ${m} = ${prod}. اكتب ${prod}، وبعدين نقسمه.`
          : `${ones} × ${m} = ${prod}. Type ${prod}, then we split it.`
        : ar
          ? `احسب ${ones} × ${m} كاملًا قبل الحمل.`
          : `Work out all of ${ones} × ${m} before you carry.`,
    tensWrong: (
      tens: number,
      m: number,
      partial: number,
      carry: number,
      sum: number,
      reveal: boolean,
    ) =>
      reveal
        ? ar
          ? `${tens} × ${m} = ${partial}، ثم ${partial} + ${carry} = ${sum}.`
          : `${tens} × ${m} = ${partial}, then ${partial} + ${carry} = ${sum}.`
        : ar
          ? `ابدأ بـ ${tens} × ${m}، ثم أضف الحمل ${carry}.`
          : `Start with ${tens} × ${m}, then add the carry ${carry}.`,
    placeWrong: ar
      ? "الحمل (عشرات الناتج) يطلع فوق. الآحاد تنزل تحت الخط."
      : "The carry goes above the tens. The ones digit goes under the line.",
    placed: ar ? "تمام. الآن اضرب العشرات." : "Good. Now multiply the tens.",
    out: (n: number, m: number, answer: number) =>
      ar
        ? `خلصت المحاولات. ${n} × ${m} = ${answer}`
        : `Out of tries. ${n} × ${m} = ${answer}`,
    learnDone: ar ? "فهمت خطوات الدرس." : "You can do the lesson steps.",
    practiceDone: ar ? "خلّصت ورقة العمل." : "Worksheet complete.",
    challengeDone: ar ? "انتهى التحدّي." : "Challenge over.",
    bundles: (carry: number, digit: number) =>
      ar
        ? `${carry} حزمة من 10، ويبقى ${digit}.`
        : `${carry} bundle${carry === 1 ? "" : "s"} of 10, and ${digit} left over.`,
    yourStars: (n: number, max: number) =>
      ar ? `${n} من ${max} نجوم` : `${n} of ${max} stars`,
  };
}

export type Copy = ReturnType<typeof messages>;
