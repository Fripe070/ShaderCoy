import type { AstroInstance } from "astro";
import FragmentEditor from "@/components/sidebar/tabs/FragmentEditor.astro";
import VertexEditor from "@/components/sidebar/tabs/VertexEditor.astro";

export const sidebarTabs: Record<
    string,
    {
        title?: string;
        icon?: string;
        component: AstroInstance["default"];
        group: "left" | "right";
    }
> = {
    fragment: {
        title: "Fragment",
        icon: "material-symbols:manga",
        component: FragmentEditor,
        group: "left",
    },
    vertex: {
        title: "Vertex",
        icon: "material-symbols:view-in-ar",
        component: VertexEditor,
        group: "left",
    },
    // texture: {
    //     title: "Texture",
    //     icon: "material-symbols:image",
    //     component: ,
    //     group: "left",
    // },
    // settings: {
    //     icon: "material-symbols:settings",
    //     component: ,
    //     group: "right",
    // },
} as const;
