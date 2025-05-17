import DarwinImg from './../_assets/darwin.jpg'
import DiadiaImg from './../_assets/diadia.jpg'
import WozziiImg from './../_assets/wozzii.jpg'

const cvData = {
  basicInfo: {
    completeName: 'Franco Moloche',
    introduction: {
      es: 'Profesional en desarrollo de software con experiencia en sectores como almacenes farmacéuticos, sistemas de almacenamiento, plataformas de aprendizaje en línea, comercios electrónicos, puntos de venta y plataformas de entretenimiento.',
      en: 'Professional in software development with experience in sectors such as drugstores, storage systems, online learning platforms, e-commerce, points of sale, and entertainment platforms.',
    },
    softSkills: {
      en: ['resilience', 'determination', 'persistence'],
      es: ['resiliencia', 'determinación', 'persistencia'],
    },
    head: {
      es: `Desarrollador front-end`,
      en: `Front-end developer`,
    },
    contact: {
      title: { es: 'Contacto', en: 'Contact' },
      location: {
        es: 'Lima, Perú (UTC-5)',
        en: 'Lima, Peru (UTC-5)',
      },
      email: 'francomolocheg99@gmail.com',
    },
    social: [
      {
        label: 'LinkedIn:',
        text: 'in/franco-moloche',
        url: 'https://linkedin.com/in/franco-moloche',
      },
    ],
  },
  technologies: {
    title: {
      es: 'Skills',
      en: 'Skills',
    },
    data: [
      'React / Next.js',
      'Typescript / Javascript',
      'Storybook',
      'React Native',
      'SPA / SSR / SSG',
      'Vue',
      'Css / Sass / Tailwind',
      'Material UI / Mantine',
      'Git / Github / Gitflow',
      'Google Cloud / Firebase',
      'Vercel',
      'AWS S3',
      'Express',
      'MongoDB',
    ],
  },
  languages: {
    title: {
      es: 'Idiomas',
      en: 'Languages',
    },
    data: [
      {
        es: 'Español (nativo)',
        en: 'Spanish (native)',
      },
      {
        es: 'Inglés (B1)',
        en: 'English (B1)',
      },
    ],
  },
  hobbies: [
    { es: 'Escalar', en: 'Climbing' },
    { es: 'Tocar guitarra', en: 'Play guitar' },
  ],
  studies: {
    title: {
      es: 'Estudios',
      en: 'Studies',
    },
    data: [
      {
        title: {
          es: 'Maestría en Data Science, Universidad Peruana de Ciencias Aplicadas',
          en: 'Ms. Data Science, Peruvian University of Applied Sciences',
        },
        period: {
          es: 'Inicio: MARZO 2025',
          en: 'Sart: MARCH 2025',
        },
        'introduction-md': {
          es: [],
          en: [],
        },
      },
      {
        title: {
          es: 'Bachiller en Ciencias de la computación, Universidad Peruana de Ciencias Aplicadas',
          en: 'B.Sc. Computer Science, Peruvian University of Applied Sciences',
        },
        period: {
          es: 'MARZO 2017 — DICIEMBRE 2022',
          en: 'MARCH 2017 — DECEMBER 2022',
        },
        'introduction-md': {
          es: [
            'Paper: GeoBlockchain: *Geolocation Based Consensus Against 51% Attacks*, [DOI: 10.5220/0011996600003467](https://doi.org/10.5220/0011996600003467)',
            'IEEEXtreme (2018-2019), Regional ICPC (2018-2019) y UPC Training Camp: Advanced Category (2019).',
          ],
          en: [
            'Paper: GeoBlockchain: *Geolocation Based Consensus Against 51% Attacks*, [DOI: 10.5220/0011996600003467](https://doi.org/10.5220/0011996600003467)',
            'IEEEXtreme (2018-2019), Regional ICPC (2018-2019) and UPC Training Camp: Advanced Category (2019).',
          ],
        },
      },
    ],
  },
  certificates: {
    titile: {
      es: 'Certificados',
      en: 'Certificates',
    },
    content: `- AlgoExpert Certificate - AlgoExpert 2023
- UI / UX Design Specialization - Coursera 2021
- Scrum Fundamentals Certified - SCRUMstudy 2021
- Validation Expert 2021 - CIDE / PUCP 2021`,
  },
  experience: {
    title: { es: 'Experiencia', en: 'Experience' },
    data: [
      {
        title: 'Front-end, CSTI Corp (Atlantic City), Lima Perú',
        period: {
          es: 'JUNIO 2024 — ACTUALIDAD',
          en: 'JUNE 2024 — PRESENT',
        },
        areas: [
          {
            'description-md': {
              es: `Mantenimiento, desarrollo de requerimientos y mejoras al casino virtual de **Atlantic City**.
- Participación principalmente en el desarrollo de carácterísticas regulatorias demandadas por Mincetur para el cancino online.
- Apoyo intermitente en el desarrollo de promociones de marketing.
`,
              en: 'Maintenance, development of requirements and improvements to the **Atlantic City** virtual casino.',
            },
            technologies: 'Next.js, React, Typescript & Azure.',
          },
        ],
      },
      {
        title:
          'Full-stack Developer, Bioprocesos industriales consultores S.A.C, Lince Perú',
        period: {
          es: 'ENERO 2024 — FEBRERO 2024',
          en: 'JANUARY 2024 — FEBRUARY 2024',
        },
        areas: [
          {
            'description-md': {
              es: `Mantenimiento y mejoras de **SIGA BPA**: plataforma para la gestión de almacenes farmacéuticos.
- Migración y desarrollo: Aplicación trasladada de Vanilla JS a React, con integración de Firebase Firestore y Storage.
- Adaptabilidad y colaboración: Adaptación a cambios tecnológicos y de requisitos, con comunicación constante con el cliente.
- Herramientas y gestión: Estilización con Bootstrap y manejo de versiones con Git/GitHub.`,
              en: 'Maintenance and improvements of **SIGA BPA**: platform for the management of pharmaceutical warehouses.',
            },
            technologies:
              'React, Typescript, Sass, Bootstrap, Electron & Firebase.',
          },
        ],
      },
      {
        title: 'Mobile Developer, Zutun (Alicorp), Lima Perú',
        period: { es: 'ABRIL 2022 — JUNIO 2023', en: 'APRIL 2022 — JUNE 2023' },
        areas: [
          {
            'description-md': {
              es: `Desarrollo de **Darwin**, proyecto de tecnología impulsado por **Alicorp**. Una plataforma como punto de venta para bodegas.
- Desarrollo y colaboración: Maquetado inicial de componentes en equipo y consumo de APIs en la aplicación.
- Gestión de estado y metodologías: Implementación de Redux y gestión del proyecto con Scrum.
- Control de versiones: Uso de Git/GitHub para control de versiones respecto al planeamiento de objetivos en equipo.`,
              en: 'Development of **Darwin**, technology project promoted by **Alicorp**. A platform as a point of sale for wineries.',
            },
            technologies:
              'React Native, Typescript, Styled components, Redux & Github.',
          },
        ],
        imagePaths: [DarwinImg.src],
      },
      {
        title: 'Front-end Developer, Zutun (Alicorp), Lima Perú',
        period: {
          es: 'ABRIL 2021 — ABRIL 2022',
          en: 'APRIL 2021 — APRIL 2022',
        },
        areas: [
          {
            'description-md': {
              es: `Desarrollo de **Diadia e Insuma**, plataformas impulsadas por **Alicorp** para el abastecimiento de bodegas y restaurantes.
- Librería de componentes MPP: Creación de componentes reutilizables junto con **𝗦𝘁𝗼𝗿𝘆𝗯𝗼𝗼𝗸** para la documentación.
- Testing library para la creación de **pruebas unitarias** y testeo de componentes
`,
              en: 'Development of **Diadia and Insuma**, platforms promoted by **Alicorp** for the supply of warehouses and restaurants.',
            },
            technologies:
              'React, Typescript, Sass (𝗕𝗘𝗠), Redux, Storybook & Github.',
          },
        ],
        imagePaths: [DiadiaImg.src],
      },
      {
        title: 'Front-end Developer, Wozzii Inc, Lima Perú',
        period: {
          es: 'AGOSTO 2020 — ABRIL 2021',
          en: 'AUGUST 2020 — APRIL 2021',
        },
        areas: [
          {
            'description-md': {
              es: 'Plataforma de educación colaborativa que ofrece un editor de notas inteligente, cursos basados en playlists de YouTube y un motor de búsqueda para notas/cursos.',
              en: 'Platform for collaborative education that offers a smart note editor, courses based on YouTube playlists and a search engine for notes/courses.',
            },
            technologies:
              'Next.js, React, Typescript, Sass, Firebase, Algolia & Github.',
          },
        ],
        imagePaths: [WozziiImg.src],
      },
      {
        title:
          'Software developer, Bioprocesos industriales consultores S.A.C, Lince Perú',
        period: {
          es: 'NOVIEMBRE 2019 — SEPTIEMBRE 2020',
          en: 'NOVEMBER 2019 — SEPTEMBER 2020',
        },
        areas: [
          {
            'description-md': {
              es: '**SIGA BPA**, plataforma para la gestión de almacenes farmacéuticos auditado y aprobado por **Digemid**.',
              en: '**SIGA BPA**, platform for the management of pharmaceutical warehouses audited and approved by **Digemid**.',
            },
            technologies:
              'React, Typescript, Sass, Bootstrap, Electron, Mongodb Atlas & Aws S3.',
          },
          {
            'description-md': {
              es: 'Sistema de pronóstico de ventas con **IA** con alertas por correo.',
              en: 'Sales forecasting system with **AI** with email alerts.',
            },
            technologies: 'Python, Tensorflow, Google cloud & Sendgrid.',
          },
          {
            'description-md': {
              es: '**Hawkings**, plataforma médica para videojuegos cognitivos.',
              en: '**Hawkings**, medical platform for cognitive video games.',
            },
            technologies: 'Angular, Typescript, Bootstrap, Sass & Firebase.',
          },
        ],
      },
    ],
  },
  sideProjects: {
    title: { es: 'Proyectos', en: 'Projects' },
    data: [
      {
        'title-md': 'Cuenta: [example.com/cuenta](https://example.com/cuenta)',
        period: {
          es: 'SEPTIEMBRE 2021 — ACTUALIDAD',
          en: 'SEPTEMBER 2021 — PRESENT',
        },
        areas: [
          {
            'description-md': {
              es: 'App para gestionar finanzas, registrar transacciones y tomar decisiones basadas en datos con informes estadísticos.',
              en: 'App to manage finances, record transactions and make data-based decisions with statistical reports.',
            },
            technologies:
              'React, Typescript, Tailwind, React Query, Firebase & Chart.js.',
          },
        ],
      },
      {
        'title-md': 'Blog: [example.com/blog](https://example.com/blog)',
        period: {
          es: 'FEBRERO 2019 — ACTUALIDAD',
          en: 'FEBRUARY 2019 — PRESENT',
        },
        areas: [
          {
            'description-md': {
              es: `Blog para proyectos y web personal.
      - **Microfrontend**: Utilizando island architecture a través de Astro.
      - Cuenta con un editor inspirado en Jupyter Notebook para la creación de artículos.`,
              en: 'Blog for projects and personal website. It has an editor inspired by Jupyter Notebook for creating posts.',
            },
            technologies: 'Astro, React, Vue, Typescript & Tailwind.',
          },
        ],
      },
    ],
  },
}

export default cvData
