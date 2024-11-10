import { StylesGuide } from "@/constants/StyleGuide";

export const buttonTypeMap = {
  primary: {
    outlined: {
      viewStyles: { 
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderColor: StylesGuide.colors.primary,
      },
      textStyles: {
        color: StylesGuide.colors.primary,
      }
    },
    fill: {
      viewStyles: { 
        backgroundColor: StylesGuide.colors.primary,
      },
      textStyles: {
        color: StylesGuide.colors.secondary,
      }
    },
  },
  secondary: {
    outlined: {
      viewStyles: { 
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderColor: StylesGuide.colors.secondary,
      },
      textStyles: {
        color: StylesGuide.colors.secondary,
      }
    },
    fill: {
      viewStyles: { 
        backgroundColor: StylesGuide.colors.secondary,
      },
      textStyles: {
        color: StylesGuide.colors.primary,
      }
    },
  },
  danger: {
    outlined: {
      viewStyles: { 
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderColor: StylesGuide.colors.danger,
      },
      textStyles: {
        color: StylesGuide.colors.danger,
      }
    },
    fill: {
      viewStyles: { 
        backgroundColor: StylesGuide.colors.danger,
      },
      textStyles: {
        color: StylesGuide.colors.primary,
      }
    },
  },
  dangerLinght: {
    outlined: {
      viewStyles: { 
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderColor: StylesGuide.colors.dangerLight,
      },
      textStyles: {
        color: StylesGuide.colors.dangerLight,
      }
    },
    fill: {
      viewStyles: { 
        backgroundColor: StylesGuide.colors.dangerLight,
      },
      textStyles: {
        color: StylesGuide.colors.primary,
      }
    },
  },
  success: {
    outlined: {
      viewStyles: { 
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderColor: StylesGuide.colors.success,
      },
      textStyles: {
        color: StylesGuide.colors.success,
      }
    },
    fill: {
      viewStyles: { 
        backgroundColor: StylesGuide.colors.success,
      },
      textStyles: {
        color: StylesGuide.colors.primary,
      }
    },
  },
  alert: {
    outlined: {
      viewStyles: { 
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderColor: StylesGuide.colors.alert,
      },
      textStyles: {
        color: StylesGuide.colors.alert,
      }
    },
    fill: {
      viewStyles: { 
        backgroundColor: StylesGuide.colors.alert,
      },
      textStyles: {
        color: StylesGuide.colors.primary,
      }
    },
  },
  info: {
    outlined: {
      viewStyles: { 
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderColor: StylesGuide.colors.info,
      },
      textStyles: {
        color: StylesGuide.colors.info,
      }
    },
    fill: {
      viewStyles: { 
        backgroundColor: StylesGuide.colors.info,
      },
      textStyles: {
        color: StylesGuide.colors.primary,
      }
    },
  }
}