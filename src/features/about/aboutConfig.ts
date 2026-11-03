import packageInfo from "../../../package.json";

export const aboutConfig = {
  version: packageInfo.version,
  repositoryUrl: "https://github.com/FridsonFirmino/sweep-dev-disk",
  developer: {
    name: "Fridson Firmino",
    title: "Engenheiro de software",
    imageUrl: null as string | null,
    socialLinks: [
      {
        label: "GitHub",
        url: "https://github.com/FridsonFirmino",
        icon: "github" as const,
      },
      {
        label: "LinkedIn",
        url: "https://www.linkedin.com/in/fridsonfirmino",
        icon: "linkedin" as const,
      },
    ],
  },
};
