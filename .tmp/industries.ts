type Industry = {
  name: string;
  slug: string;
  bannerImg: string;
  overview: {
    title: string;
    des: string;
  };

  experties: {
    title: string;
    des: string;
    features: [
      {
        title: string;
        des: string;
        img: string;
      },
    ];
  };

  whyUs: {
    title: string;
    items: [
      {
        icon: string;
        title: string;
        des: string;
      },
    ];
  };

  caseStudy: number;

  faq: {
    title: string;
    description: string;
    qas: [
      {
        question: string;
        anwser: string;
      },
    ];
  };
};

type solution = {
  name: string;
  slug: string;
  kind: "logistic" | "lines" | "ports_infra";
  bannerImg: string;
  overview?: {
    title: string;
    description: string;
    img: string;
  };

  service?: {
    title: string;
    description: string;
    services: [
      {
        title: string;
        description: string;
        img: string;
      },
    ];
  };

  experties?: {
    title: string;
    des?: string;
    features: [
      {
        title: string;
        description: string;
        img: string;
      },
    ];
  };

  whyUs?: {
    title: string;
    items: [
      {
        icon: string;
        title: string;
        description: string;
      },
    ];
  };

  certifications?: {
    title: string;
    description: string;
    image: string;
  };

  faq?: {
    title: string;
    description: string;
    faqs: [
      {
        question: string;
        anwser: string;
      },
    ];
  };
};
