const foregroundColoursDark = {
    fgNormal: "#ABB2BF",
    fgMuted: "#5C6370",

    fgAccent: "#528BFF",
    fgContrast: "#ffffff",

    // Syntax colours
    fgPurple: "#C678DD",
    fgRed: "#E06C75",
    fgRedDark: "#BE5046",
    fgBlue: "#61AFEF",
    fgCyan: "#56B6C2",
    fgGreen: "#98C379",
    fgOrange: "#E5C07B",
    fgOrangeDark: "#D19A66",
} as const;

const foregroundColoursLight: Record<keyof typeof foregroundColoursDark, string> = {
    fgNormal: "#383A42",
    fgMuted: "#A0A1A7",

    fgAccent: "#528BFF",
    fgContrast: "#000000",

    // Syntax colours
    fgPurple: "#A626A4",
    fgRed: "#E45649",
    fgRedDark: "#CA1243",
    fgBlue: "#4078F2",
    fgCyan: "#0184BC",
    fgGreen: "#50A14F",
    fgOrange: "#C18401",
    fgOrangeDark: "#986801",
} as const;

const backgroundColoursDark = {
    bgVeryDark: "#1B1D23",
    bgDark: "#21252b",
    bgNormal: "#282c34",
    bgLight: "#333842",

    bgSelection: "#3E4451",
    bgHighlight: "#2c313a",
    bgCurrentLine: "#99BBFF0A",
    bgTooltip: "#353b45",
    bgMatch: "#528BFF3D",
} as const;

const backgroundColoursLight: Record<keyof typeof backgroundColoursDark, string> = {
    bgVeryDark: "#ffffff",
    bgDark: "#eaeaeb",
    bgNormal: "#fafafa",
    bgLight: "#f5f5f5",

    bgSelection: "#E5E5E6",
    bgHighlight: "#DBDBDC",
    bgCurrentLine: "#383A420C",
    bgTooltip: "#FFFFFF",
    bgMatch: "#526FFF33",
} as const;

export type ThemeColours = Record<
    keyof typeof foregroundColoursDark | keyof typeof backgroundColoursDark,
    string
>;

// Normal
export const darkTheme: ThemeColours = {
    ...foregroundColoursDark,
    ...backgroundColoursDark,
};
export const lightTheme: ThemeColours = {
    ...foregroundColoursLight,
    ...backgroundColoursLight,
};
