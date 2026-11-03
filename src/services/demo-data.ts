import type { Project } from "@/types/domain";

export const demoProjects: Project[] = [
  {
    id: "sweep-dev-disk",
    name: "sweep-dev-disk",
    path: "/home/ines/Projects/sweep-dev-disk",
    technology: "React · Rust · Tauri",
    lastActivity: "2026-11-02T16:40:00.000Z",
    artifacts: [
      {
        id: "sweep-node-modules",
        name: "node_modules",
        path: "/home/ines/Projects/sweep-dev-disk/node_modules",
        sizeBytes: 438_304_768,
        reclaimableBytes: 438_304_768,
        risk: "low",
      },
      {
        id: "sweep-target",
        name: "target",
        path: "/home/ines/Projects/sweep-dev-disk/src-tauri/target",
        sizeBytes: 812_646_400,
        reclaimableBytes: 812_646_400,
        risk: "medium",
      },
    ],
  },
  {
    id: "notes-app",
    name: "notes-app",
    path: "/home/ines/Projects/notes-app",
    technology: "Next.js · TypeScript",
    lastActivity: "2026-10-30T09:15:00.000Z",
    artifacts: [
      {
        id: "notes-next",
        name: ".next",
        path: "/home/ines/Projects/notes-app/.next",
        sizeBytes: 296_747_008,
        reclaimableBytes: 296_747_008,
        risk: "low",
      },
      {
        id: "notes-modules",
        name: "node_modules",
        path: "/home/ines/Projects/notes-app/node_modules",
        sizeBytes: 623_902_720,
        reclaimableBytes: 623_902_720,
        risk: "low",
      },
    ],
  },
  {
    id: "api-service",
    name: "api-service",
    path: "/home/ines/Projects/api-service",
    technology: "Rust · Cargo",
    lastActivity: "2026-10-26T14:05:00.000Z",
    artifacts: [
      {
        id: "api-target",
        name: "target",
        path: "/home/ines/Projects/api-service/target",
        sizeBytes: 1_073_741_824,
        reclaimableBytes: 1_073_741_824,
        risk: "medium",
      },
      {
        id: "api-dist",
        name: "dist",
        path: "/home/ines/Projects/api-service/dist",
        sizeBytes: 64_225_280,
        reclaimableBytes: 64_225_280,
        risk: "low",
      },
    ],
  },
];
