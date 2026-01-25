export type StudentProfile = {
  slug: string;
  name: string;
  detail: string;
  num: string;
  totalVolume: string;
  daysActive: string;
  lastSession: string;
  routine: {
    label: string;
    title: string;
    focus: string;
    progress: string;
    total: string;
  };
  completedRoutines: Array<{
    title: string;
    completed: string;
    weeks: string;
  }>;
};

export const students: StudentProfile[] = [
  {
    slug: "alex-stevens",
    name: "Alex Stevens",
    detail: "Active routine: 21-week hypertrophy",
    num: "01",
    totalVolume: "450,200 KG",
    daysActive: "112",
    lastSession: "2 HOURS AGO",
    routine: {
      label: "Active program",
      title: "Hypertrophy Phase II",
      focus: "Focus: Metabolic Stress & High Volume",
      progress: "04",
      total: "21",
    },
    completedRoutines: [
      {
        title: "Strength Foundations",
        completed: "Completed June 2023",
        weeks: "12 WEEKS",
      },
      {
        title: "Base Conditioning",
        completed: "Completed March 2023",
        weeks: "08 WEEKS",
      },
      {
        title: "Mobility Protocol A",
        completed: "Completed January 2023",
        weeks: "04 WEEKS",
      },
    ],
  },
  {
    slug: "alex-rivera",
    name: "Alex Rivera",
    detail: "Active routine: 21-week hypertrophy",
    num: "02",
    totalVolume: "318,400 KG",
    daysActive: "86",
    lastSession: "6 HOURS AGO",
    routine: {
      label: "Active program",
      title: "Hypertrophy Phase I",
      focus: "Focus: Tempo Control & Volume",
      progress: "11",
      total: "18",
    },
    completedRoutines: [
      {
        title: "Strength Foundations",
        completed: "Completed February 2023",
        weeks: "10 WEEKS",
      },
      {
        title: "Base Conditioning",
        completed: "Completed December 2022",
        weeks: "08 WEEKS",
      },
    ],
  },
  {
    slug: "jordan-smith",
    name: "Jordan Smith",
    detail: "Active routine: reps till failure",
    num: "03",
    totalVolume: "512,080 KG",
    daysActive: "144",
    lastSession: "1 DAY AGO",
    routine: {
      label: "Active program",
      title: "Reps Till Failure",
      focus: "Focus: Mechanical Tension",
      progress: "07",
      total: "16",
    },
    completedRoutines: [
      {
        title: "Power Density",
        completed: "Completed May 2023",
        weeks: "12 WEEKS",
      },
      {
        title: "Athletic Base",
        completed: "Completed January 2023",
        weeks: "10 WEEKS",
      },
    ],
  },
  {
    slug: "sarah-cheng",
    name: "Sarah Cheng",
    detail: "Status: program pending",
    num: "04",
    totalVolume: "76,400 KG",
    daysActive: "18",
    lastSession: "3 DAYS AGO",
    routine: {
      label: "Active program",
      title: "Foundation Phase",
      focus: "Focus: Movement Quality",
      progress: "02",
      total: "08",
    },
    completedRoutines: [],
  },
  {
    slug: "mike-ross",
    name: "Mike Ross",
    detail: "Active routine: 21-week hypertrophy",
    num: "05",
    totalVolume: "298,600 KG",
    daysActive: "74",
    lastSession: "9 HOURS AGO",
    routine: {
      label: "Active program",
      title: "Hypertrophy Phase II",
      focus: "Focus: Metabolic Stress & High Volume",
      progress: "03",
      total: "21",
    },
    completedRoutines: [
      {
        title: "Strength Foundations",
        completed: "Completed April 2023",
        weeks: "12 WEEKS",
      },
    ],
  },
  {
    slug: "elena-vance",
    name: "Elena Vance",
    detail: "Active routine: reps till failure",
    num: "06",
    totalVolume: "404,920 KG",
    daysActive: "102",
    lastSession: "12 HOURS AGO",
    routine: {
      label: "Active program",
      title: "Reps Till Failure",
      focus: "Focus: Mechanical Tension",
      progress: "05",
      total: "16",
    },
    completedRoutines: [
      {
        title: "Power Density",
        completed: "Completed February 2023",
        weeks: "12 WEEKS",
      },
    ],
  },
  {
    slug: "chris-wong",
    name: "Chris Wong",
    detail: "Status: complete",
    num: "07",
    totalVolume: "612,240 KG",
    daysActive: "172",
    lastSession: "5 DAYS AGO",
    routine: {
      label: "Active program",
      title: "Performance Peak",
      focus: "Focus: Strength & Speed",
      progress: "16",
      total: "16",
    },
    completedRoutines: [
      {
        title: "Power Density",
        completed: "Completed November 2023",
        weeks: "16 WEEKS",
      },
      {
        title: "Base Conditioning",
        completed: "Completed July 2023",
        weeks: "12 WEEKS",
      },
    ],
  },
  {
    slug: "marcus-tull",
    name: "Marcus Tull",
    detail: "Active routine: 21-week hypertrophy",
    num: "08",
    totalVolume: "355,710 KG",
    daysActive: "90",
    lastSession: "7 HOURS AGO",
    routine: {
      label: "Active program",
      title: "Hypertrophy Phase I",
      focus: "Focus: Time Under Tension",
      progress: "09",
      total: "18",
    },
    completedRoutines: [
      {
        title: "Strength Foundations",
        completed: "Completed September 2023",
        weeks: "12 WEEKS",
      },
    ],
  },
  {
    slug: "jenna-lane",
    name: "Jenna Lane",
    detail: "Status: new member",
    num: "09",
    totalVolume: "42,300 KG",
    daysActive: "10",
    lastSession: "1 DAY AGO",
    routine: {
      label: "Active program",
      title: "Foundation Phase",
      focus: "Focus: Movement Quality",
      progress: "01",
      total: "08",
    },
    completedRoutines: [],
  },
];
