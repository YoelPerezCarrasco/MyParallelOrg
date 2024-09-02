import MaterialTailwind from '@material-tailwind/react'

declare module '@material-tailwind/react' {
  interface ButtonProps {
    placeholder?
  }

  interface NavbarProps {
    placeholder?
  }

  interface TypographyProps {
    placeholder?
  }
}