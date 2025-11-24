// Paquetes de créditos de diseño disponibles
export const DESIGN_CREDIT_PACKAGES = {
    SMALL: {
        credits: 20,
        price: 34900, // COP
        name: 'Paquete Básico',
        description: '20 créditos de diseño'
    },
    MEDIUM: {
        credits: 50,
        price: 69900, // COP
        name: 'Paquete Estándar',
        description: '50 créditos de diseño'
    },
    LARGE: {
        credits: 120,
        price: 99900, // COP
        name: 'Paquete Premium',
        description: '120 créditos de diseño'
    }
} as const;

export type PackageType = keyof typeof DESIGN_CREDIT_PACKAGES;

