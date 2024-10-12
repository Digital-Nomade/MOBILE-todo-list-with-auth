import { Styles } from "@/constants/Colors";

export const buttonTypeMap = {
  primary: {
    outlined: {
      viewStyles: { 
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderColor: Styles.colors.primary,
      },
      textStyles: {
        color: Styles.colors.primary,
      }
    },
    fill: {
      viewStyles: { 
        backgroundColor: Styles.colors.primary,
      },
      textStyles: {
        color: Styles.colors.secondary,
      }
    },
  },
  secondary: {
    outlined: {
      viewStyles: { 
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderColor: Styles.colors.secondary,
      },
      textStyles: {
        color: Styles.colors.secondary,
      }
    },
    fill: {
      viewStyles: { 
        backgroundColor: Styles.colors.secondary,
      },
      textStyles: {
        color: Styles.colors.primary,
      }
    },
  },
  danger: {
    outlined: {
      viewStyles: { 
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderColor: Styles.colors.danger,
      },
      textStyles: {
        color: Styles.colors.danger,
      }
    },
    fill: {
      viewStyles: { 
        backgroundColor: Styles.colors.danger,
      },
      textStyles: {
        color: Styles.colors.primary,
      }
    },
  },
  dangerLinght: {
    outlined: {
      viewStyles: { 
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderColor: Styles.colors.dangerLight,
      },
      textStyles: {
        color: Styles.colors.dangerLight,
      }
    },
    fill: {
      viewStyles: { 
        backgroundColor: Styles.colors.dangerLight,
      },
      textStyles: {
        color: Styles.colors.primary,
      }
    },
  },
  success: {
    outlined: {
      viewStyles: { 
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderColor: Styles.colors.success,
      },
      textStyles: {
        color: Styles.colors.success,
      }
    },
    fill: {
      viewStyles: { 
        backgroundColor: Styles.colors.success,
      },
      textStyles: {
        color: Styles.colors.primary,
      }
    },
  },
  alert: {
    outlined: {
      viewStyles: { 
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderColor: Styles.colors.alert,
      },
      textStyles: {
        color: Styles.colors.alert,
      }
    },
    fill: {
      viewStyles: { 
        backgroundColor: Styles.colors.alert,
      },
      textStyles: {
        color: Styles.colors.primary,
      }
    },
  },
  info: {
    outlined: {
      viewStyles: { 
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderColor: Styles.colors.info,
      },
      textStyles: {
        color: Styles.colors.info,
      }
    },
    fill: {
      viewStyles: { 
        backgroundColor: Styles.colors.info,
      },
      textStyles: {
        color: Styles.colors.primary,
      }
    },
  }
}