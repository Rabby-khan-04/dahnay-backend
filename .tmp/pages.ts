type Blog = {
  title: string;
  excerpt: string;
  blogImg: string;
  content: string; //rich html text
  type: "CASE_STUDY" | "BLOG" | "NEWS";
  status: string; // Existing status;
  publishedAt: Date;
};

type AboutPages = {
  name: string;
  type: "ABOUT" | "ESG_CSR" | "CAREERS";
  image: string;
  title?: string;
  description?: string;
  whoWeAre?: {
    description: string;
    img: string;
    counter: [
      {
        number: number;
        title: string;
      },
    ];
  };
  whyUs?: {
    title: string;
    description: string;
    items: [
      {
        icon: string;
        title: string;
        description: string;
      },
    ];
  };

  ceoInfo?: {
    name: string;
    about: string;
    image: string;
    social: [{ type: string; url: string }];
  };

  cta?: {
    title: string;
    description: string;
    img: string;
  };

  faq?: {
    title: string;
    description: string;
    faqs: [{ question: string; answer: string }];
  };

  infoBlock?: [
    {
      title: string;
      description: string;
      image: string;
    },
  ];

  bannerImg?: string;
};

// for about page data
type About = {
  name: string;
  type: "ABOUT";
  image: string;
  whoWeAre?: {
    description: string;
    img: string;
    counter: [
      {
        number: number;
        title: string;
      },
    ];
  };

  whyUs?: {
    title: string;
    description: string;
    items: [
      {
        icon: string;
        title: string;
        description: string;
      },
    ];
  };

  ceoInfo?: {
    name: string;
    about: string;
    image: string;
    social: [{ type: string; url: string }];
  };

  cta?: {
    title: string;
    description: string;
    img: string;
  };

  faq?: {
    title: string;
    description: string;
    faqs: [{ question: string; answer: string }];
  };
};

// for esg_csr page data
type ESG_CSR = {
  name: string;
  type: "ESG_CSR";
  image: string;
  title?: string;
  description?: string;

  infoBlock?: [
    {
      title: string;
      description: string;
      image: string;
    },
  ];

  cta?: {
    title: string;
    description: string;
    img: string;
  };
};

// for CAREERS page data type
type CAREERS = {
  name: string;
  type: "CAREERS";
  image: string;
  bannerImg?: string;
  infoBlock?: [
    {
      title: string;
      description: string;
      image: string;
    },
  ];
};

type Page = {
  bannerImg?: string;
  counter?: [{ count: string; title: string }];
  banner?: [
    {
      image: string;
      title: string;
      description: string;
    },
  ];

  offer?: {
    title: string;
    description: string;
    image?: string;
    video?: string;
  };

  solutions: {
    title: string;
    description: string;
  };

  aboutUs: {
    title: string;
    description: string;
    video: string;
    image: string;
  };

  whyUs: {
    title: string;
    description: string;
    items: [
      {
        icon: string;
        title: string;
        description: string;
      },
    ];
  };

  info: {
    title: string;
    images: [string];
    bannerImg: string;
  };

  cta: {
    title: string;
    bannerImg: string;
  };

  faq: {
    title: string;
    description: string;
    faqs: [
      {
        question: string;
        answer: string;
      },
    ];
  };
};
type Home = {
  banner?: [
    {
      image: string;
      title: string;
      description: string;
    },
  ];

  offer?: {
    title: string;
    description: string;
    image?: string;
    video?: string;
  };

  solutions: {
    title: string;
    description: string;
  };

  aboutUs: {
    title: string;
    description: string;
    video: string;
    image: string;
  };

  whyUs: {
    title: string;
    description: string;
    items: [
      {
        icon: string;
        title: string;
        description: string;
      },
    ];
  };

  info: {
    title: string;
    images: [string];
    bannerImg: string;
  };

  cta: {
    title: string;
    bannerImg: string;
  };

  faq: {
    title: string;
    description: string;
    faqs: [
      {
        question: string;
        answer: string;
      },
    ];
  };
};
type Contact = {
  bannerImg?: string;
  counter?: [{ count: string; title: string }];
};
