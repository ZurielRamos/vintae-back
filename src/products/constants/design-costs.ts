// Costos fijos en créditos para compra de diseños
export const DESIGN_DOWNLOAD_COSTS = {
    ONE: 1,        // 1 descarga = 1 crédito
    FIVE: 3,       // 5 descargas = 3 créditos
    UNLIMITED: 5,  // Ilimitado = 5 créditos
} as const;

export type DownloadType = keyof typeof DESIGN_DOWNLOAD_COSTS;
