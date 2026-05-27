<!-- Design System -->
<!DOCTYPE html><html class="light" lang="en"><head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1.0" name="viewport">
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&amp;family=Inter:wght@400;500;600&amp;family=Playfair+Display:ital,wght@1,400&amp;display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet">
<script id="tailwind-config">
    tailwind.config = {
      darkMode: "class",
      theme: {
        extend: {
          "colors": {
            "surface": "#faf8fe",
            "surface-container-low": "#f4f3f9",
            "on-primary": "#ffffff",
            "tertiary-fixed": "#ffdbd1",
            "outline": "#757681",
            "on-secondary": "#ffffff",
            "inverse-surface": "#2f3035",
            "on-error": "#ffffff",
            "on-primary-fixed-variant": "#2d4480",
            "on-background": "#1a1b20",
            "on-tertiary-fixed-variant": "#76321f",
            "inverse-primary": "#b3c5ff",
            "error-container": "#ffdad6",
            "surface-container": "#efedf3",
            "secondary-fixed-dim": "#ffb59d",
            "on-tertiary": "#ffffff",
            "on-primary-fixed": "#00184a",
            "inverse-on-surface": "#f2f0f6",
            "surface-bright": "#faf8fe",
            "surface-container-lowest": "#ffffff",
            "error": "#ba1a1a",
            "primary-fixed-dim": "#b3c5ff",
            "tertiary": "#240400",
            "background": "#faf8fe",
            "on-secondary-container": "#5a1700",
            "outline-variant": "#c5c6d1",
            "surface-dim": "#dbd9df",
            "on-surface": "#1a1b20",
            "secondary-fixed": "#ffdbd0",
            "tertiary-fixed-dim": "#ffb5a0",
            "primary-container": "#001f5b",
            "secondary-container": "#fd652f",
            "on-surface-variant": "#444650",
            "surface-container-highest": "#e3e2e7",
            "primary-fixed": "#dbe1ff",
            "surface-variant": "#e3e2e7",
            "surface-container-high": "#e9e7ed",
            "on-tertiary-container": "#ca745c",
            "on-tertiary-fixed": "#3b0900",
            "surface-tint": "#465c99",
            "on-primary-container": "#7389ca",
            "tertiary-container": "#481002",
            "secondary": "#ac3400",
            "primary": "#000c2e",
            "on-error-container": "#93000a",
            "on-secondary-fixed-variant": "#842600",
            "on-secondary-fixed": "#390b00"
          },
          "borderRadius": {
            "DEFAULT": "0.125rem",
            "lg": "0.25rem",
            "xl": "0.5rem",
            "full": "0.75rem"
          },
          "spacing": {
            "grid-40": "40%",
            "section-v-padding-md": "6rem",
            "section-v-padding-lg": "8rem",
            "grid-60": "60%",
            "gutter": "2rem"
          },
          "fontFamily": {
            "display-xl": ["Barlow Condensed"],
            "label-caps": ["Barlow Condensed"],
            "headline-lg": ["Barlow Condensed"],
            "eyebrow-bold": ["Barlow Condensed"],
            "headline-lg-mobile": ["Barlow Condensed"],
            "body-sm": ["Inter"],
            "accent-italic": ["Playfair Display"],
            "body-main": ["Inter"]
          },
          "fontSize": {
            "display-xl": ["72px", {"lineHeight": "1.0", "letterSpacing": "-0.02em", "fontWeight": "700"}],
            "label-caps": ["12px", {"lineHeight": "1.0", "letterSpacing": "0.1em", "fontWeight": "600"}],
            "headline-lg": ["48px", {"lineHeight": "1.1", "fontWeight": "700"}],
            "eyebrow-bold": ["16px", {"lineHeight": "1.2", "letterSpacing": "0.05em", "fontWeight": "600"}],
            "headline-lg-mobile": ["36px", {"lineHeight": "1.1", "fontWeight": "700"}],
            "body-sm": ["14px", {"lineHeight": "1.5", "fontWeight": "400"}],
            "accent-italic": ["inherit", {"fontWeight": "400"}],
            "body-main": ["18px", {"lineHeight": "1.6", "fontWeight": "400"}]
          }
        },
      },
    }
  </script>
<style>
    body {
      background-color: #FAFAF8; /* Custom warm off-white per prompt */
      color: #1a1b20;
    }
    .material-symbols-outlined {
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    }
    .orange-tick::before {
      content: "";
      display: block;
      width: 24px;
      height: 4px;
      background-color: #fd652f;
      margin-bottom: 8px;
    }
    .hairline-rule {
      border-top: 1px solid #72A9BE;
    }
  </style>
</head>
<body class="antialiased">
<!-- TopNavBar (Shared Component) -->
<header class="bg-primary sticky top-0 z-50 flex justify-between items-center w-full px-gutter py-4 border-b border-outline-variant">
<div class="font-display-xl text-headline-lg-mobile md:text-headline-lg text-on-primary tracking-tighter">BU SHPE</div>
<!-- Desktop Navigation -->
<nav class="hidden md:flex gap-8 items-center">
<a class="text-secondary-container font-bold border-b-2 border-secondary-container font-label-caps text-label-caps uppercase tracking-widest" href="#">ABOUT</a>
<a class="text-on-primary opacity-80 hover:text-secondary-container transition-colors duration-300 font-label-caps text-label-caps uppercase tracking-widest" href="#">MEMBERSHIP</a>
<a class="text-on-primary opacity-80 hover:text-secondary-container transition-colors duration-300 font-label-caps text-label-caps uppercase tracking-widest" href="#">EVENTS</a>
<a class="text-on-primary opacity-80 hover:text-secondary-container transition-colors duration-300 font-label-caps text-label-caps uppercase tracking-widest" href="#">RESOURCES</a>
<a class="text-on-primary opacity-80 hover:text-secondary-container transition-colors duration-300 font-label-caps text-label-caps uppercase tracking-widest" href="#">PARTNERS</a>
<a class="text-on-primary opacity-80 hover:text-secondary-container transition-colors duration-300 font-label-caps text-label-caps uppercase tracking-widest" href="#">CONTACT</a>
</nav>
<button class="bg-secondary-container text-primary font-label-caps text-label-caps font-bold px-6 py-2 rounded-[6px] hover:scale-95 duration-150 transition-transform">
      JOIN NOW
    </button>
</header>
<main>
<!-- Hero Section -->
<section class="px-gutter py-section-v-padding-lg max-w-7xl mx-auto flex flex-col md:flex-row gap-16 items-start">
<div class="md:w-grid-60">
<h1 class="font-display-xl text-[64px] md:text-display-xl leading-[0.95] text-primary mb-12">
          Building the next generation of Hispanic engineers, <span class="font-accent-italic text-accent-italic italic text-secondary-container lowercase">together</span>.
        </h1>
<p class="font-body-main text-body-main text-on-surface-variant max-w-xl mb-8">
          The Society of Hispanic Professional Engineers (SHPE) at Boston University empowers the Hispanic community to realize its fullest potential and to impact the world through STEM awareness, access, support, and development.
        </p>
<div class="flex gap-4">
<button class="bg-secondary-container text-primary font-label-caps text-label-caps font-bold px-8 py-4 rounded-[6px] hover:opacity-90 transition-opacity">
            EXPLORE CHAPTER
          </button>
<button class="border border-primary text-primary font-label-caps text-label-caps font-bold px-8 py-4 rounded-[6px] hover:bg-primary-container hover:text-on-primary transition-all">
            VIEW EVENTS
          </button>
</div>
</div>
<div class="md:w-grid-40 w-full">
<div class="relative">
<img alt="BU SHPE Students" class="w-full grayscale brightness-90 border-l-[12px] border-secondary-container" data-alt="A diverse group of Hispanic engineering students collaborating around a large wooden table in a high-tech modern laboratory. The lighting is crisp and editorial, highlighting focused expressions and technical blueprints. The aesthetic is clean and professional with a palette of deep navy blues and vibrant orange accents, reflecting a prestigious institutional atmosphere." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDa3SPhlRQ4BolvL0rxjaidey-XW0Gd_EhFfHbA8esNmmf9NEKFgOHR6SDQwUhWE3TjVGkF67bzLmm5rOf0FHgTChk2-RMgpZtkro5RvzwwemIK5hsJEaLRYlrAxcQMuIk22eppudD62lZ4AlA38_Jc9DJuaYNqMqZI1_Rk1sYT0a1oTP7yABGOT9gFoiTboZYvAd1flXdE7Ti8jMTU_h6V-qan3JV5AqOTOCv1zTgGTAAOELr2cEJe22YqlVx5WXWtK1qPi-PIQXk">
<div class="absolute -bottom-6 -left-6 bg-primary text-on-primary p-6 font-label-caps text-label-caps tracking-widest">
            EST. 1974
          </div>
</div>
</div>
</section>
<!-- Hairline Divider -->
<div class="px-gutter">
<div class="hairline-rule w-full"></div>
</div>
<!-- Mission Section (60/40 Asymmetric Split) -->
<section class="px-gutter py-section-v-padding-md max-w-7xl mx-auto flex flex-col md:flex-row gap-20">
<div class="md:w-grid-40 order-2 md:order-1">
<div class="orange-tick"></div>
<p class="font-accent-italic text-4xl italic text-primary leading-tight">
          "Diversity is not just a metric; it is the catalyst for the innovation that will solve the next century's most pressing engineering challenges."
        </p>
<div class="mt-8">
<span class="font-label-caps text-label-caps uppercase text-secondary tracking-widest">— BU SHPE Executive Board</span>
</div>
</div>
<div class="md:w-grid-60 order-1 md:order-2">
<span class="font-eyebrow-bold text-eyebrow-bold text-secondary uppercase mb-4 block">OUR MISSION</span>
<h2 class="font-headline-lg text-headline-lg text-primary mb-8">Paving a pathway for Hispanic brilliance in STEM.</h2>
<p class="font-body-main text-body-main text-on-surface-variant mb-6">
          We are dedicated to changing lives by empowering the Hispanic community to realize its fullest potential and to impact the world through STEM awareness, access, support, and development. 
        </p>
<p class="font-body-main text-body-main text-on-surface-variant">
          Our chapter at Boston University provides a home-away-from-home for engineers, designers, and scientists, offering a unique blend of professional mentorship and academic rigor.
        </p>
</div>
</section>
<!-- Programs Section (Zig-Zag) -->
<section class="py-section-v-padding-md bg-surface-container-low">
<div class="max-w-7xl mx-auto px-gutter space-y-32">
<!-- Zig-Zag 1: Conferences -->
<div class="flex flex-col md:flex-row items-center gap-16">
<div class="md:w-1/2">
<img alt="Conferences" class="w-full h-[400px] object-cover" data-alt="A wide-angle shot of a massive professional conference hall filled with thousands of aspiring Hispanic engineers. The scene is illuminated by dramatic stage lighting in shades of navy and orange, creating an atmosphere of excitement and prestige. The visual style is high-contrast editorial photography, capturing the scale and energy of the SHPE National Convention." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCihTCndIjQX2OWdMCQK0dkyOqb2etmW8sibzhrINzhfQetR8xcfJ7izq3puhZnkvVCfOTUMkXTZF5XM0KxtTwFyNc10jKYSl9rVb5PyHhBqtZRmELDkynQi1pobwrC0s_1aHD0FEw8Fxguqqz0gy8t-agn3LPap6SZzEplGBQscvjWk_LW3W4UoZON21lPq8ggHBVLXywDL37Nx8bXV5g2NPVxQRNd2UX795oOE-rLl-govTbV9whA5gY8PdZxsGVBNSsV_RYggZk">
</div>
<div class="md:w-1/2">
<div class="orange-tick"></div>
<h3 class="font-headline-lg text-headline-lg text-primary mb-4">Conferences</h3>
<p class="font-body-main text-body-main text-on-surface-variant mb-8">
              Every year, we take our members to the SHPE National Convention—the largest Hispanic technical conference in the world. It’s where resumes meet dream jobs.
            </p>
<ul class="space-y-3">
<li class="flex items-center gap-3">
<span class="w-2 h-2 bg-primary"></span>
<span class="font-label-caps text-label-caps">RESUME REVIEWS</span>
</li>
<li class="flex items-center gap-3">
<span class="w-2 h-2 bg-primary"></span>
<span class="font-label-caps text-label-caps">INTERVIEW PREP</span>
</li>
<li class="flex items-center gap-3">
<span class="w-2 h-2 bg-primary"></span>
<span class="font-label-caps text-label-caps">CAREER FAIRS</span>
</li>
</ul>
</div>
</div>
<!-- Zig-Zag 2: Volunteering (Reversed) -->
<div class="flex flex-col md:flex-row-reverse items-center gap-16">
<div class="md:w-1/2">
<img alt="Volunteering" class="w-full h-[400px] object-cover" data-alt="Close-up shot of hands-on community service where engineering students are teaching young children how to build basic circuit boards. The lighting is warm and natural, suggesting a friendly and community-oriented environment. The focus is sharp on the technical components and the diverse hands working together, emphasizing the mission of STEM outreach and education." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtY0yMxPzBZyivtSwAsYlFjFIv2UyjD1xSGquvUt9QfwHOYVJKOm9AVxd7N5GhS8cH5HuwkqtlPWuiCjeAdc_LePXbSDgpKUXglNo5tGyKIMgF4r6sazTCxPJmmJMNtpeNNwBG-jx1lVB6DK3K3Ub25iyYZ5TSaEVUSoGeWYjkwaXsyFEdknaQK0a7u2yKERv9BEz23jKUXf3R7wxmiW29GzdmK7oW1EbmlFAl-9PXgVbizF1eUJo08rn1JmaeXsALDdBrQ77SCeI">
</div>
<div class="md:w-1/2">
<div class="orange-tick"></div>
<h3 class="font-headline-lg text-headline-lg text-primary mb-4">Volunteering</h3>
<p class="font-body-main text-body-main text-on-surface-variant mb-8">
              Giving back is in our DNA. We mentor local high school students and run workshops to inspire the next generation to pursue careers in STEM.
            </p>
<ul class="space-y-3">
<li class="flex items-center gap-3">
<span class="w-2 h-2 bg-primary"></span>
<span class="font-label-caps text-label-caps">K-12 OUTREACH</span>
</li>
<li class="flex items-center gap-3">
<span class="w-2 h-2 bg-primary"></span>
<span class="font-label-caps text-label-caps">LOCAL STEM FAIRS</span>
</li>
<li class="flex items-center gap-3">
<span class="w-2 h-2 bg-primary"></span>
<span class="font-label-caps text-label-caps">CHAPTER MENTORSHIP</span>
</li>
</ul>
</div>
</div>
<!-- Zig-Zag 3: Professional Development -->
<div class="flex flex-col md:flex-row items-center gap-16">
<div class="md:w-1/2">
<img alt="Professional Development" class="w-full h-[400px] object-cover" data-alt="A modern, high-contrast photograph of a professional workshop in a glass-walled conference room. A diverse speaker stands in front of a digital presentation board, engaging with a group of attentive young professionals. The aesthetic is sleek and corporate, with deep navy and orange visual cues throughout the office environment, portraying intellectual rigor and career advancement." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAp8Lpamr_p-Be4YOH_4A8hUnD_Kq83XElJukomrGCuyRfo1ScVQEifE7AkrOfJNtkM7UP1OA-YZjdkjlcA69MoBr4c7MJyg2hCcRMtsPN5Ex8VxB-4p6MTujz9POW4ZoNdisywuwqtx5orh0WjmBTiuyjft0YEwgldc0LaDuGrFKnAfRduk4PMsGiKYZGjy71B41hHwdE8Whsl4mKPhHkyE9TUN2VlGDyE5BJYWxIAZ8z-y91Jt5Ntu8QwF8v8F2jEJt3rXLJWhEE">
</div>
<div class="md:w-1/2">
<div class="orange-tick"></div>
<h3 class="font-headline-lg text-headline-lg text-primary mb-4">Professional Development</h3>
<p class="font-body-main text-body-main text-on-surface-variant mb-8">
              From LinkedIn optimizations to technical workshops with industry giants like Google and Boeing, we ensure our members are ready for the workforce.
            </p>
<ul class="space-y-3">
<li class="flex items-center gap-3">
<span class="w-2 h-2 bg-primary"></span>
<span class="font-label-caps text-label-caps">CORPORATE MIXERS</span>
</li>
<li class="flex items-center gap-3">
<span class="w-2 h-2 bg-primary"></span>
<span class="font-label-caps text-label-caps">TECH TALKS</span>
</li>
<li class="flex items-center gap-3">
<span class="w-2 h-2 bg-primary"></span>
<span class="font-label-caps text-label-caps">SOFT SKILLS SEMINARS</span>
</li>
</ul>
</div>
</div>
</div>
</section>
<!-- CTA Section -->
<section class="bg-primary-container py-24 text-on-primary">
<div class="max-w-7xl mx-auto px-gutter flex flex-col md:flex-row items-center justify-between gap-12">
<div class="max-w-2xl">
<h2 class="font-display-xl text-headline-lg md:text-[64px] mb-4 text-[#F5F5DC]">Join the familia</h2>
<p class="font-body-main text-on-primary-container text-xl">
            Whether you are a student, alumni, or corporate partner, there is a place for you in our mission to change the face of engineering.
          </p>
</div>
<button class="bg-secondary-container text-primary font-label-caps text-label-caps font-bold px-12 py-6 rounded-[6px] hover:scale-105 transition-transform text-lg shrink-0">
          JOIN NOW
        </button>
</div>
</section>
</main>
<!-- Footer (Shared Component) -->
<footer class="bg-primary text-white py-section-v-padding-md px-gutter grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-outline-variant">
<div class="space-y-8">
<div class="font-display-xl text-headline-lg text-on-primary tracking-tighter">BU SHPE</div>
<p class="font-body-sm text-body-sm opacity-70 max-w-sm">
        Boston University Chapter of the Society of Hispanic Professional Engineers.
      </p>
<div class="flex gap-6"><a class="material-symbols-outlined text-on-primary hover:text-secondary-fixed transition-colors" href="#">twitter</a><a class="material-symbols-outlined text-on-primary hover:text-secondary-fixed transition-colors" href="#">work</a><a class="material-symbols-outlined text-on-primary hover:text-secondary-fixed transition-colors" href="#">photo_camera</a><a class="material-symbols-outlined text-on-primary hover:text-secondary-fixed transition-colors" href="#">mail</a></div>
</div>
<div class="flex flex-col md:items-end justify-between">
<div class="flex flex-wrap gap-8 md:justify-end mb-12">
<a class="font-body-sm text-body-sm text-on-primary opacity-70 hover:text-secondary-fixed hover:opacity-100 transition-all" href="#">CONSTITUTION</a>
<a class="font-body-sm text-body-sm text-on-primary opacity-70 hover:text-secondary-fixed hover:opacity-100 transition-all" href="#">NATIONAL SHPE</a>
<a class="font-body-sm text-body-sm text-on-primary opacity-70 hover:text-secondary-fixed hover:opacity-100 transition-all" href="#">PRIVACY POLICY</a>
<a class="font-body-sm text-body-sm text-on-primary opacity-70 hover:text-secondary-fixed hover:opacity-100 transition-all" href="#">ACCESSIBILITY</a>
</div>
<p class="font-body-sm text-body-sm opacity-50 tracking-widest uppercase">
        © 2024 BU SHPE. ALL RIGHTS RESERVED.
      </p>
</div>
</footer>
<script>
    // Micro-interactions for the cards and images
    document.querySelectorAll('img').forEach(img => {
      img.addEventListener('mouseenter', () => {
        img.style.filter = 'grayscale(0%)';
        img.style.transition = 'filter 0.5s ease-in-out';
      });
      img.addEventListener('mouseleave', () => {
        img.style.filter = 'grayscale(100%)';
      });
    });
  </script>


</body></html>

<!-- Home — BU SHPE -->
<!DOCTYPE html><html class="light" lang="en"><head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1.0" name="viewport">
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700&amp;family=Inter:wght@400;600&amp;family=Playfair+Display:ital@0;1&amp;display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet">
<style>
    .material-symbols-outlined {
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #faf8fe;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #72A9BE;
    }
    .orange-tick {
      width: 24px;
      height: 4px;
      background-color: #FD652F;
      display: block;
      margin-bottom: 8px;
    }
    .hairline-border {
      border: 1px solid #72A9BE;
    }
  </style>
<script id="tailwind-config">
    tailwind.config = {
      darkMode: "class",
      theme: {
        extend: {
          "colors": {
            "surface": "#faf8fe",
            "surface-container-low": "#f4f3f9",
            "on-primary": "#ffffff",
            "tertiary-fixed": "#ffdbd1",
            "outline": "#757681",
            "on-secondary": "#ffffff",
            "inverse-surface": "#2f3035",
            "on-error": "#ffffff",
            "on-primary-fixed-variant": "#2d4480",
            "on-background": "#1a1b20",
            "on-tertiary-fixed-variant": "#76321f",
            "inverse-primary": "#b3c5ff",
            "error-container": "#ffdad6",
            "surface-container": "#efedf3",
            "secondary-fixed-dim": "#ffb59d",
            "on-tertiary": "#ffffff",
            "on-primary-fixed": "#00184a",
            "inverse-on-surface": "#f2f0f6",
            "surface-bright": "#faf8fe",
            "surface-container-lowest": "#ffffff",
            "error": "#ba1a1a",
            "primary-fixed-dim": "#b3c5ff",
            "tertiary": "#240400",
            "background": "#faf8fe",
            "on-secondary-container": "#5a1700",
            "outline-variant": "#c5c6d1",
            "surface-dim": "#dbd9df",
            "on-surface": "#1a1b20",
            "secondary-fixed": "#ffdbd0",
            "tertiary-fixed-dim": "#ffb5a0",
            "primary-container": "#001f5b",
            "secondary-container": "#fd652f",
            "on-surface-variant": "#444650",
            "surface-container-highest": "#e3e2e7",
            "primary-fixed": "#dbe1ff",
            "surface-variant": "#e3e2e7",
            "surface-container-high": "#e9e7ed",
            "on-tertiary-container": "#ca745c",
            "on-tertiary-fixed": "#3b0900",
            "surface-tint": "#465c99",
            "on-primary-container": "#7389ca",
            "tertiary-container": "#481002",
            "secondary": "#ac3400",
            "primary": "#000c2e",
            "on-error-container": "#93000a",
            "on-secondary-fixed-variant": "#842600",
            "on-secondary-fixed": "#390b00"
          },
          "borderRadius": {
            "DEFAULT": "0.125rem",
            "lg": "0.25rem",
            "xl": "0.5rem",
            "full": "0.75rem"
          },
          "spacing": {
            "grid-40": "40%",
            "section-v-padding-md": "6rem",
            "section-v-padding-lg": "8rem",
            "grid-60": "60%",
            "gutter": "2rem"
          },
          "fontFamily": {
            "display-xl": ["Barlow Condensed"],
            "label-caps": ["Barlow Condensed"],
            "headline-lg": ["Barlow Condensed"],
            "eyebrow-bold": ["Barlow Condensed"],
            "headline-lg-mobile": ["Barlow Condensed"],
            "body-sm": ["Inter"],
            "accent-italic": ["Playfair Display"],
            "body-main": ["Inter"]
          },
          "fontSize": {
            "display-xl": ["72px", {"lineHeight": "1.0", "letterSpacing": "-0.02em", "fontWeight": "700"}],
            "label-caps": ["12px", {"lineHeight": "1.0", "letterSpacing": "0.1em", "fontWeight": "600"}],
            "headline-lg": ["48px", {"lineHeight": "1.1", "fontWeight": "700"}],
            "eyebrow-bold": ["16px", {"lineHeight": "1.2", "letterSpacing": "0.05em", "fontWeight": "600"}],
            "headline-lg-mobile": ["36px", {"lineHeight": "1.1", "fontWeight": "700"}],
            "body-sm": ["14px", {"lineHeight": "1.5", "fontWeight": "400"}],
            "accent-italic": ["inherit", {"fontWeight": "400"}],
            "body-main": ["18px", {"lineHeight": "1.6", "fontWeight": "400"}]
          }
        },
      },
    }
  </script>
</head>
<body class="bg-surface text-on-surface selection:bg-secondary-container selection:text-on-secondary-container">
<!-- Shared Component: TopNavBar -->
<header class="bg-primary dark:bg-primary text-on-primary dark:text-on-primary font-label-caps text-label-caps uppercase tracking-widest docked full-width top-0 border-b border-outline-variant flat no shadows flex justify-between items-center w-full px-gutter py-4 max-w-full sticky z-50">
<div class="font-display-xl text-headline-lg text-on-primary tracking-tighter">BU SHPE</div>
<nav class="hidden md:flex gap-8">
<a class="text-on-primary opacity-80 hover:text-secondary-container transition-colors duration-300" href="#">ABOUT</a>
<a class="text-on-primary opacity-80 hover:text-secondary-container transition-colors duration-300" href="#">MEMBERSHIP</a>
<a class="text-secondary-container font-bold border-b-2 border-secondary-container" href="#">BOARD</a>
<a class="text-on-primary opacity-80 hover:text-secondary-container transition-colors duration-300" href="#">EVENTS</a>
<a class="text-on-primary opacity-80 hover:text-secondary-container transition-colors duration-300" href="#">RESOURCES</a>
<a class="text-on-primary opacity-80 hover:text-secondary-container transition-colors duration-300" href="#">PARTNERS</a>
<a class="text-on-primary opacity-80 hover:text-secondary-container transition-colors duration-300" href="#">CONTACT</a>
</nav>
<button class="bg-secondary-container text-primary font-label-caps py-2 px-6 rounded-[6px] font-bold tracking-widest hover:scale-95 duration-150">JOIN NOW</button>
</header>
<main>
<!-- Page Hero -->
<section class="py-section-v-padding-lg px-gutter border-b border-outline-variant">
<div class="max-w-7xl mx-auto flex flex-col md:flex-row items-end justify-between">
<div class="md:w-grid-60">
<span class="orange-tick"></span>
<h1 class="font-display-xl text-display-xl uppercase leading-none">
            Meet the <em class="font-accent-italic italic font-normal normal-case">board</em>.
          </h1>
<p class="font-body-main text-body-main mt-8 max-w-xl text-on-surface-variant">
            Driving the mission of Hispanic excellence in engineering at Boston University. Our leadership team focuses on professional development, community impact, and academic success.
          </p>
</div>
<div class="md:w-grid-40 mt-12 md:mt-0 flex flex-col items-start md:items-end">
<div class="hairline-border p-4 bg-surface-container-low max-w-xs">
<span class="font-label-caps text-label-caps text-secondary mb-2 block uppercase">Elected Term</span>
<span class="font-headline-lg text-headline-lg">2024—2025</span>
</div>
</div>
</div>
</section>
<!-- Board Grid -->
<section class="py-section-v-padding-md px-gutter">
<div class="max-w-7xl mx-auto">
<div class="grid grid-cols-1 md:grid-cols-2 gap-16">
<!-- Executive Member: President -->
<article class="flex flex-col md:flex-row gap-8 group">
<div class="md:w-1/2 aspect-[4/5] overflow-hidden hairline-border relative">
<img class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="A professional headshot of a confident Hispanic man in a modern navy blue blazer, standing against a clean architectural backdrop of Boston University. The lighting is bright and directional, emphasizing sharp features and a visionary expression. The overall aesthetic is clean, academic, and institutionally prestigious, matching the BU SHPE brand colors." src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9mIYzT7aQpsM2WYHFvwtUjTSqFs-xI7PYrwKGTu10S0xzYhQdF-3YdbseuNy0h-4YLAXB6c4k9u9NQVR0pCzuJsRfZwcCAoUXVcfrR0mr3QwIxctml78kgnYhOFRBusdge85R68xDhgUPACk6C6GY0YGwmYUA7gHlymqEbDbDTSc61bqdMO4WA1loao1WiZ12l78F7TsCAg2rgGpmCzccpJsL4m6AaG0pZNUT7mmy_aMdzE0aSdNQmc3WDhbiwz_lClGQXAkEs4s">
</div>
<div class="md:w-1/2 flex flex-col justify-center">
<span class="font-label-caps text-label-caps text-secondary uppercase mb-2">President</span>
<h3 class="font-headline-lg text-headline-lg mb-4">Mateo Rodriguez</h3>
<p class="font-body-sm text-body-sm text-on-surface-variant italic mb-6">"Leading the chapter towards a future where Hispanic engineers are the architects of innovation."</p>
<div class="border-l-2 border-primary-container pl-4">
<span class="font-eyebrow-bold text-eyebrow-bold block">Mechanical Engineering</span>
<span class="font-body-sm text-body-sm opacity-70">Senior, Class of 2025</span>
</div>
</div>
</article>
<!-- Executive Member: VP -->
<article class="flex flex-col md:flex-row gap-8 group">
<div class="md:w-1/2 aspect-[4/5] overflow-hidden hairline-border relative">
<img class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="A professional portrait of a Hispanic woman with a bright, welcoming smile, wearing a professional cream-colored suit. The background is a soft-focus urban environment with modern glass structures. The mood is empowering and sophisticated, lit with warm natural afternoon light that highlights the editorial magazine aesthetic of the publication." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQ8fO8mCQxftTnHNOn23SYnSZ-sPLHJKbS1kx_VFNDHLZmyIrur_FE3OHlj0H7E9iXg01eFTx-5g-cDfelvr4zyyMLfYygchwqwsTzJZdynQtmYp7FyMHWdTM9lq8TkByf5_SljPIXcNS88BpBpHOWvJOOf_jGb15d6hIqMegHRJRAPQYylG-5_cfhXlaQHHvt6mCecgSiXkV8Xat05vsJaCeSntZ7yYBtteSDnyPgBJdPb_KHnJkK9HppCOo57x8-6a0nuADKtdw">
</div>
<div class="md:w-1/2 flex flex-col justify-center">
<span class="font-label-caps text-label-caps text-secondary uppercase mb-2">Vice President</span>
<h3 class="font-headline-lg text-headline-lg mb-4">Elena Sanchez</h3>
<p class="font-body-sm text-body-sm text-on-surface-variant italic mb-6">"Bridging the gap between academic rigor and professional excellence through mentorship."</p>
<div class="border-l-2 border-primary-container pl-4">
<span class="font-eyebrow-bold text-eyebrow-bold block">Biomedical Engineering</span>
<span class="font-body-sm text-body-sm opacity-70">Junior, Class of 2026</span>
</div>
</div>
</article>
<!-- Executive Member: Treasurer -->
<article class="flex flex-col md:flex-row gap-8 group">
<div class="md:w-1/2 aspect-[4/5] overflow-hidden hairline-border relative">
<img class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="A high-end editorial headshot of a young Hispanic professional looking slightly away from the camera, wearing a charcoal grey sweater. The setting is a library with geometric bookshelves creating a brutalist background pattern. The lighting is dramatic and contrasted, emphasizing intellectual focus and prestige in line with the institution's visual identity." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBRXyyHitmxn0poIKoaiHzvNhinyvw3PlNEcWB3Ir_OAnVGhansU0J90yO8oZBmWMa18t7p-hOJeOEah2w2YIV8iLfI9lyrXRviz9YNJZdHI2opOQjCAP-Bcg67GYL9VFYMiF_lMaew8I6GMJPU0PGAjUYEyw_2fazhhu9qUpfh5x-qpoKy8odoi9CKRO6rVOd468SY0CNUjjxkJTaWMlAAf4UTXl1XDWxelfhh0LI59cj9SfgQNn9Raeo94wyHwXtn7M0hSsoWNEI">
</div>
<div class="md:w-1/2 flex flex-col justify-center">
<span class="font-label-caps text-label-caps text-secondary uppercase mb-2">Treasurer</span>
<h3 class="font-headline-lg text-headline-lg mb-4">Carlos Mendoza</h3>
<p class="font-body-sm text-body-sm text-on-surface-variant italic mb-6">"Ensuring the sustainable growth of our chapter's resources to benefit all members."</p>
<div class="border-l-2 border-primary-container pl-4">
<span class="font-eyebrow-bold text-eyebrow-bold block">Computer Engineering</span>
<span class="font-body-sm text-body-sm opacity-70">Sophomore, Class of 2027</span>
</div>
</div>
</article>
<!-- Empty State / TBD Member: Secretary -->
<article class="flex flex-col md:flex-row gap-8 group">
<div class="md:w-1/2 aspect-[4/5] bg-surface-container-highest hairline-border flex items-center justify-center relative p-12">
<div class="text-center">
<span class="material-symbols-outlined text-6xl text-outline-variant mb-4" style="font-variation-settings: 'FILL' 0;">person_add</span>
<p class="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Election in progress</p>
</div>
</div>
<div class="md:w-1/2 flex flex-col justify-center">
<span class="font-label-caps text-label-caps text-secondary uppercase mb-2">Secretary</span>
<h3 class="font-headline-lg text-headline-lg mb-4 text-outline-variant">TBD</h3>
<div class="bg-primary-container p-6 hairline-border">
<p class="font-body-sm text-body-sm text-on-primary-container mb-4">The Secretary position is currently open for the 2024-2025 academic term. Interested candidates should review the constitution.</p>
<button class="bg-secondary-container text-primary font-label-caps py-2 px-4 rounded-[6px] font-bold text-xs">VIEW REQUIREMENTS</button>
</div>
</div>
</article>
</div>
</div>
</section>
<!-- Asymmetric Editorial Feature -->
<section class="py-section-v-padding-lg px-gutter border-t border-outline-variant bg-surface-container-low">
<div class="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 items-center">
<div class="md:w-grid-40 order-2 md:order-1">
<h2 class="font-display-xl text-headline-lg mb-6 uppercase">Our Vision</h2>
<p class="font-body-main text-body-main mb-8">
            The board is more than just leadership; it is a collaborative engine. We meet weekly to discuss member engagement, corporate sponsorships, and the implementation of our "SHPE Familia" core values.
          </p>
<ul class="space-y-4">
<li class="flex items-start gap-4">
<span class="w-3 h-3 bg-primary mt-2"></span>
<span class="font-body-sm text-body-sm">Fostering a sense of community for Hispanic engineers on campus.</span>
</li>
<li class="flex items-start gap-4">
<span class="w-3 h-3 bg-primary mt-2"></span>
<span class="font-body-sm text-body-sm">Providing direct pipelines to industry-leading Fortune 500 companies.</span>
</li>
<li class="flex items-start gap-4">
<span class="w-3 h-3 bg-primary mt-2"></span>
<span class="font-body-sm text-body-sm">Ensuring academic support through peer tutoring and study banks.</span>
</li>
</ul>
</div>
<div class="md:w-grid-60 order-1 md:order-2 aspect-[16/9] bg-primary relative overflow-hidden">
<img class="w-full h-full object-cover" data-alt="A dynamic wide-angle shot of the BU SHPE executive board members standing together in a modern, glass-walled conference room overlooking the Boston skyline at sunset. The lighting is high-contrast with warm orange highlights and deep navy shadows, reflecting a professional and high-achieving atmosphere. The architectural lines are sharp and brutalist, emphasizing the editorial magazine style of the page." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDa3SPhlRQ4BolvL0rxjaidey-XW0Gd_EhFfHbA8esNmmf9NEKFgOHR6SDQwUhWE3TjVGkF67bzLmm5rOf0FHgTChk2-RMgpZtkro5RvzwwemIK5hsJEaLRYlrAxcQMuIk22eppudD62lZ4AlA38_Jc9DJuaYNqMqZI1_Rk1sYT0a1oTP7yABGOT9gFoiTboZYvAd1flXdE7Ti8jMTU_h6V-qan3JV5AqOTOCv1zTgGTAAOELr2cEJe22YqlVx5WXWtK1qPi-PIQXk">
<div class="absolute inset-0 border-[24px] border-surface pointer-events-none"></div>
</div>
</div>
</section>
<!-- Navy CTA Band -->
<section class="bg-primary py-24 px-gutter text-center relative overflow-hidden">
  <div class="max-w-4xl mx-auto relative z-10">
    <h2 class="font-display text-6xl md:text-7xl font-bold text-on-primary uppercase mb-6">LEAD WITH US.</h2>
    <p class="font-body-main text-lg md:text-xl text-primary-fixed mb-12 max-w-2xl mx-auto opacity-90 leading-relaxed">
      Interested in joining the extended board or leading a specific committee? We are always looking for passionate members to help organize events and manage outreach.
    </p>
    <div class="flex flex-col md:flex-row justify-center gap-6">
      <button class="bg-secondary-container text-primary font-display font-bold py-4 px-10 rounded-lg text-lg hover:bg-on-primary transition-all duration-300 uppercase tracking-wide">Apply for Committee</button>
      <button class="border-2 border-on-primary text-on-primary font-display font-bold py-4 px-10 rounded-lg text-lg hover:bg-on-primary hover:text-primary transition-all duration-300 uppercase tracking-wide">Our Constitution</button>
    </div>
  </div>
</section>
</main>
<!-- Shared Component: Footer -->
<footer class="bg-primary text-on-primary py-12 px-gutter">
  <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
    <div class="space-y-6">
      <div class="font-display text-4xl font-bold tracking-tighter">BU SHPE</div>
      <p class="max-w-xs text-sm opacity-80 font-body-main">
        Empowering the Hispanic community to realize its fullest potential and to impact the world through STEM awareness, access, support, and development.
      </p>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-2 gap-x-16 gap-y-8">
      <div class="space-y-4">
        <h4 class="font-display text-lg font-bold text-secondary-container uppercase tracking-wider">Quick Links</h4>
        <ul class="space-y-2 text-sm">
          <li class=""><a href="#" class="hover:text-secondary-container transition-colors">CONSTITUTION</a></li>
          <li class=""><a href="#" class="hover:text-secondary-container transition-colors">NATIONAL SHPE</a></li>
        </ul>
      </div>
      <div class="space-y-4">
        <h4 class="font-display text-lg font-bold text-secondary-container uppercase tracking-wider">Legal</h4>
        <ul class="space-y-2 text-sm">
          <li class=""><a href="#" class="hover:text-secondary-container transition-colors">PRIVACY POLICY</a></li>
          <li class=""><a href="#" class="hover:text-secondary-container transition-colors">ACCESSIBILITY</a></li>
        </ul>
      </div>
    </div>
  </div>
  <div class="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/10 text-xs opacity-50 text-center md:text-left">
    © 2024 BU SHPE. ALL RIGHTS RESERVED.
  </div>
</footer>
<script>
    // Micro-interactions for board cards
    document.querySelectorAll('article').forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.querySelector('.hairline-border').style.borderColor = '#FD652F';
      });
      card.addEventListener('mouseleave', () => {
        card.querySelector('.hairline-border').style.borderColor = '#72A9BE';
      });
    });
  </script>


</body></html>

<!-- Board — BU SHPE -->
<!DOCTYPE html><html class="light" lang="en"><head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1.0" name="viewport">
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&amp;family=Inter:wght@400;600&amp;family=Playfair+Display:ital@1&amp;family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet">
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "surface": "#faf8fe",
                        "surface-container-low": "#f4f3f9",
                        "on-primary": "#ffffff",
                        "tertiary-fixed": "#ffdbd1",
                        "outline": "#757681",
                        "on-secondary": "#ffffff",
                        "inverse-surface": "#2f3035",
                        "on-error": "#ffffff",
                        "on-primary-fixed-variant": "#2d4480",
                        "on-background": "#1a1b20",
                        "on-tertiary-fixed-variant": "#76321f",
                        "inverse-primary": "#b3c5ff",
                        "error-container": "#ffdad6",
                        "surface-container": "#efedf3",
                        "secondary-fixed-dim": "#ffb59d",
                        "on-tertiary": "#ffffff",
                        "on-primary-fixed": "#00184a",
                        "inverse-on-surface": "#f2f0f6",
                        "surface-bright": "#faf8fe",
                        "surface-container-lowest": "#ffffff",
                        "error": "#ba1a1a",
                        "primary-fixed-dim": "#b3c5ff",
                        "tertiary": "#240400",
                        "background": "#faf8fe",
                        "on-secondary-container": "#5a1700",
                        "outline-variant": "#c5c6d1",
                        "surface-dim": "#dbd9df",
                        "on-surface": "#1a1b20",
                        "secondary-fixed": "#ffdbd0",
                        "tertiary-fixed-dim": "#ffb5a0",
                        "primary-container": "#001f5b",
                        "secondary-container": "#fd652f",
                        "on-surface-variant": "#444650",
                        "surface-container-highest": "#e3e2e7",
                        "primary-fixed": "#dbe1ff",
                        "surface-variant": "#e3e2e7",
                        "surface-container-high": "#e9e7ed",
                        "on-tertiary-container": "#ca745c",
                        "on-tertiary-fixed": "#3b0900",
                        "surface-tint": "#465c99",
                        "on-primary-container": "#7389ca",
                        "tertiary-container": "#481002",
                        "secondary": "#ac3400",
                        "primary": "#000c2e",
                        "on-error-container": "#93000a",
                        "on-secondary-fixed-variant": "#842600",
                        "on-secondary-fixed": "#390b00"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.125rem",
                        "lg": "0.25rem",
                        "xl": "0.5rem",
                        "full": "0.75rem"
                    },
                    "spacing": {
                        "grid-40": "40%",
                        "section-v-padding-md": "6rem",
                        "section-v-padding-lg": "8rem",
                        "grid-60": "60%",
                        "gutter": "2rem"
                    },
                    "fontFamily": {
                        "display-xl": ["Barlow Condensed"],
                        "label-caps": ["Barlow Condensed"],
                        "headline-lg": ["Barlow Condensed"],
                        "eyebrow-bold": ["Barlow Condensed"],
                        "headline-lg-mobile": ["Barlow Condensed"],
                        "body-sm": ["Inter"],
                        "accent-italic": ["Playfair Display"],
                        "body-main": ["Inter"]
                    },
                    "fontSize": {
                        "display-xl": ["72px", {"lineHeight": "1.0", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                        "label-caps": ["12px", {"lineHeight": "1.0", "letterSpacing": "0.1em", "fontWeight": "600"}],
                        "headline-lg": ["48px", {"lineHeight": "1.1", "fontWeight": "700"}],
                        "eyebrow-bold": ["16px", {"lineHeight": "1.2", "letterSpacing": "0.05em", "fontWeight": "600"}],
                        "headline-lg-mobile": ["36px", {"lineHeight": "1.1", "fontWeight": "700"}],
                        "body-sm": ["14px", {"lineHeight": "1.5", "fontWeight": "400"}],
                        "accent-italic": ["inherit", {"fontWeight": "400"}],
                        "body-main": ["18px", {"lineHeight": "1.6", "fontWeight": "400"}]
                    }
                }
            }
        }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            display: inline-block;
            line-height: 1;
        }
        .orange-tick::before {
            content: '';
            display: block;
            width: 12px;
            height: 4px;
            background-color: #fd652f;
            margin-bottom: 8px;
        }
        .editorial-rule {
            border-top: 1px solid #c5c6d1;
        }
        .vertical-rule {
            border-left: 1px solid #c5c6d1;
        }
    </style>
</head>
<body class="bg-surface text-on-surface font-body-main selection:bg-secondary-container selection:text-on-secondary-container">
<!-- TopNavBar -->
<nav class="bg-primary text-on-primary fixed top-0 left-0 w-full z-50 border-b border-outline-variant flex justify-between items-center px-gutter py-4">
<div class="font-display-xl text-headline-lg-mobile md:text-headline-lg text-on-primary tracking-tighter">BU SHPE</div>
<div class="hidden md:flex gap-8 items-center">
<a class="font-label-caps text-label-caps uppercase tracking-widest text-on-primary opacity-80 hover:text-secondary-container transition-colors duration-300" href="#">ABOUT</a>
<a class="font-label-caps text-label-caps uppercase tracking-widest text-on-primary opacity-80 hover:text-secondary-container transition-colors duration-300" href="#">MEMBERSHIP</a>
<a class="font-label-caps text-label-caps uppercase tracking-widest text-secondary-container font-bold border-b-2 border-secondary-container transition-colors duration-300" href="#">EVENTS</a>
<a class="font-label-caps text-label-caps uppercase tracking-widest text-on-primary opacity-80 hover:text-secondary-container transition-colors duration-300" href="#">RESOURCES</a>
<a class="font-label-caps text-label-caps uppercase tracking-widest text-on-primary opacity-80 hover:text-secondary-container transition-colors duration-300" href="#">PARTNERS</a>
<a class="font-label-caps text-label-caps uppercase tracking-widest text-on-primary opacity-80 hover:text-secondary-container transition-colors duration-300" href="#">CONTACT</a>
</div>
<button class="bg-secondary-container text-primary font-label-caps text-label-caps px-6 py-3 font-bold hover:scale-95 transition-transform duration-150 rounded-none">
            JOIN NOW
        </button>
</nav>
<main class="pt-24">
<!-- Page Hero -->
<section class="px-gutter py-section-v-padding-lg max-w-7xl">
<div class="orange-tick font-eyebrow-bold text-eyebrow-bold text-secondary uppercase">CALENDAR 2024</div>
<h1 class="font-display-xl text-display-xl mt-4 leading-none">
                Events &amp; <span class="font-accent-italic italic text-secondary">opportunities</span>.
            </h1>
<p class="max-w-2xl mt-8 font-body-main text-body-main text-on-surface-variant">
                From professional development workshops to community building socials, discover how BU SHPE empowers Hispanic STEM students to reach their full potential.
            </p>
</section>
<!-- Filter Bar (Server-side style) -->
<section class="px-gutter pb-12 border-b border-outline-variant">
<div class="flex flex-wrap gap-4 items-center">
<span class="font-label-caps text-label-caps text-on-surface-variant uppercase mr-4">Filter By:</span>
<a class="px-6 py-2 border border-primary bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-wider" href="#">All</a>
<a class="px-6 py-2 border border-outline-variant hover:border-primary transition-colors font-label-caps text-label-caps uppercase tracking-wider" href="#">Social</a>
<a class="px-6 py-2 border border-outline-variant hover:border-primary transition-colors font-label-caps text-label-caps uppercase tracking-wider" href="#">Professional</a>
<a class="px-6 py-2 border border-outline-variant hover:border-primary transition-colors font-label-caps text-label-caps uppercase tracking-wider" href="#">Community</a>
</div>
</section>
<!-- Featured Event (Editorial Layout) -->
<section class="px-gutter py-section-v-padding-md grid grid-cols-1 md:grid-cols-10 gap-12 items-center">
<div class="md:col-span-6 order-2 md:order-1">
<div class="orange-tick font-eyebrow-bold text-eyebrow-bold text-secondary uppercase mb-2">FEATURED ENGAGEMENT</div>
<h2 class="font-headline-lg text-headline-lg mb-6">Annual Engineering Gala: Building Bridges</h2>
<p class="font-body-main text-body-main text-on-surface-variant mb-8 leading-relaxed">
                    Join us for our signature networking event of the year. Connect with industry leaders from top tech firms and celebrate the achievements of our SHPE Familia in a night of professional excellence and cultural pride.
                </p>
<div class="flex items-center gap-8 font-label-caps text-label-caps text-primary border-t border-outline-variant pt-6">
<div class="flex flex-col">
<span class="opacity-60">DATE</span>
<span class="font-bold text-lg">NOV 15, 2024</span>
</div>
<div class="flex flex-col">
<span class="opacity-60">LOCATION</span>
<span class="font-bold text-lg">GSU BALLROOM</span>
</div>
<div class="flex flex-col">
<span class="opacity-60">TIME</span>
<span class="font-bold text-lg">6:00 PM</span>
</div>
</div>
</div>
<div class="md:col-span-4 order-1 md:order-2">
<div class="aspect-[4/5] bg-surface-container overflow-hidden">
<img alt="Gala Event" class="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 scale-105 hover:scale-100" data-alt="A professional engineering gala event in a grand ballroom with elegant lighting and modern architecture. Students and professionals in formal attire are engaged in networking, with a sophisticated blue and orange color palette. The atmosphere is prestigious, high-end, and celebratory of technical achievement and community diversity." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCihTCndIjQX2OWdMCQK0dkyOqb2etmW8sibzhrINzhfQetR8xcfJ7izq3puhZnkvVCfOTUMkXTZF5XM0KxtTwFyNc10jKYSl9rVb5PyHhBqtZRmELDkynQi1pobwrC0s_1aHD0FEw8Fxguqqz0gy8t-agn3LPap6SZzEplGBQscvjWk_LW3W4UoZON21lPq8ggHBVLXywDL37Nx8bXV5g2NPVxQRNd2UX795oOE-rLl-govTbV9whA5gY8PdZxsGVBNSsV_RYggZk">
</div>
</div>
</section>
<!-- 3-Column Grid for Upcoming Events -->
<section class="px-gutter py-section-v-padding-md bg-surface-container-low border-y border-outline-variant">
<div class="max-w-7xl mx-auto">
<div class="flex justify-between items-end mb-12 border-b border-outline-variant pb-6">
<h3 class="font-headline-lg text-headline-lg">UPCOMING SESSIONS</h3>
<div class="font-label-caps text-label-caps text-primary">03 UPCOMING THIS MONTH</div>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-0 border-x border-outline-variant">
<!-- Event Card 1 -->
<div class="group border-r border-outline-variant last:border-r-0 flex flex-col bg-surface hover:bg-white transition-colors">
<div class="p-8 flex flex-col h-full">
<span class="font-label-caps text-label-caps text-secondary font-bold tracking-widest mb-4">GENERAL MEETING</span>
<div class="text-display-xl font-display-xl leading-[0.8] mb-6 opacity-10 group-hover:opacity-20 transition-opacity">22 OCT</div>
<h4 class="font-headline-lg text-headline-lg-mobile mb-4 group-hover:text-secondary transition-colors">Semester Kick-off &amp; Pizza</h4>
<p class="font-body-sm text-body-sm text-on-surface-variant flex-grow mb-8">
                                Meet the new board, learn about upcoming national conferences, and grab a slice with the familia. Open to all STEM majors.
                            </p>
<div class="editorial-rule pt-4 flex justify-between items-center">
<span class="font-label-caps text-label-caps">7:00 PM | PHO 202</span>
<span class="material-symbols-outlined text-secondary">arrow_forward</span>
</div>
</div>
</div>
<!-- Event Card 2 -->
<div class="group border-r border-outline-variant last:border-r-0 flex flex-col bg-surface hover:bg-white transition-colors">
<div class="p-8 flex flex-col h-full">
<span class="font-label-caps text-label-caps text-secondary font-bold tracking-widest mb-4">WORKSHOP</span>
<div class="text-display-xl font-display-xl leading-[0.8] mb-6 opacity-10 group-hover:opacity-20 transition-opacity">28 OCT</div>
<h4 class="font-headline-lg text-headline-lg-mobile mb-4 group-hover:text-secondary transition-colors">Resume &amp; Portfolio Review</h4>
<p class="font-body-sm text-body-sm text-on-surface-variant flex-grow mb-8">
                                Get 1-on-1 feedback on your technical resume from senior members and alumni who secured internships at FAANG and top firms.
                            </p>
<div class="editorial-rule pt-4 flex justify-between items-center">
<span class="font-label-caps text-label-caps">5:30 PM | ENG 101</span>
<span class="material-symbols-outlined text-secondary">arrow_forward</span>
</div>
</div>
</div>
<!-- Event Card 3 -->
<div class="group border-r border-outline-variant last:border-r-0 flex flex-col bg-surface hover:bg-white transition-colors">
<div class="p-8 flex flex-col h-full">
<span class="font-label-caps text-label-caps text-secondary font-bold tracking-widest mb-4">SOCIAL</span>
<div class="text-display-xl font-display-xl leading-[0.8] mb-6 opacity-10 group-hover:opacity-20 transition-opacity">02 NOV</div>
<h4 class="font-headline-lg text-headline-lg-mobile mb-4 group-hover:text-secondary transition-colors">SHPE Game Night</h4>
<p class="font-body-sm text-body-sm text-on-surface-variant flex-grow mb-8">
                                Take a break from the labs. An evening of board games, video games, and bonding. Snacks and drinks will be provided.
                            </p>
<div class="editorial-rule pt-4 flex justify-between items-center">
<span class="font-label-caps text-label-caps">8:00 PM | GSU 312</span>
<span class="material-symbols-outlined text-secondary">arrow_forward</span>
</div>
</div>
</div>
</div>
</div>
</section>
<!-- Past Events / Archive Section -->
<section class="px-gutter py-section-v-padding-md grid grid-cols-1 md:grid-cols-12 gap-12">
<div class="md:col-span-4 border-l-4 border-secondary pl-8">
<h3 class="font-headline-lg text-headline-lg mb-4">Event Archives</h3>
<p class="font-body-main text-body-main text-on-surface-variant">
                    Missed a workshop? Access presentation slides, recorded sessions, and photos from our past gatherings in the editorial portal.
                </p>
<button class="mt-8 flex items-center gap-2 font-label-caps text-label-caps border-b-2 border-primary pb-1 group">
                    VIEW ALL PAST EVENTS
                    <span class="material-symbols-outlined group-hover:translate-x-2 transition-transform">trending_flat</span>
</button>
</div>
<div class="md:col-span-8">
<div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
<div class="group cursor-pointer">
<div class="aspect-video bg-surface-container overflow-hidden mb-4">
<img alt="Past Workshop" class="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-500" data-alt="A candid action shot of engineering students working collaboratively on a hardware project in a bright campus lab. The lighting is natural and clear, emphasizing focus and teamwork. The scene captures the energy of a technical workshop with wires, laptops, and prototype boards visible in a modern light-mode academic environment." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtY0yMxPzBZyivtSwAsYlFjFIv2UyjD1xSGquvUt9QfwHOYVJKOm9AVxd7N5GhS8cH5HuwkqtlPWuiCjeAdc_LePXbSDgpKUXglNo5tGyKIMgF4r6sazTCxPJmmJMNtpeNNwBG-jx1lVB6DK3K3Ub25iyYZ5TSaEVUSoGeWYjkwaXsyFEdknaQK0a7u2yKERv9BEz23jKUXf3R7wxmiW29GzdmK7oW1EbmlFAl-9PXgVbizF1eUJo08rn1JmaeXsALDdBrQ77SCeI">
</div>
<h5 class="font-label-caps text-label-caps mb-1 opacity-60">SEPTEMBER 2024</h5>
<p class="font-headline-lg text-headline-lg-mobile text-[24px]">Intro to Python for Engineers</p>
</div>
<div class="group cursor-pointer">
<div class="aspect-video bg-surface-container overflow-hidden mb-4">
<img alt="Study Social" class="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-500" data-alt="A group of diverse university students studying together in a modern, open-plan student union. Large windows fill the space with soft daylight. The atmosphere is academic yet social, featuring books, coffee cups, and digital devices on a large oak table, rendered in a crisp, high-contrast light-mode style with navy and orange accents." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAp8Lpamr_p-Be4YOH_4A8hUnD_Kq83XElJukomrGCuyRfo1ScVQEifE7AkrOfJNtkM7UP1OA-YZjdkjlcA69MoBr4c7MJyg2hCcRMtsPN5Ex8VxB-4p6MTujz9POW4ZoNdisywuwqtx5orh0WjmBTiuyjft0YEwgldc0LaDuGrFKnAfRduk4PMsGiKYZGjy71B41hHwdE8Whsl4mKPhHkyE9TUN2VlGDyE5BJYWxIAZ8z-y91Jt5Ntu8QwF8v8F2jEJt3rXLJWhEE">
</div>
<h5 class="font-label-caps text-label-caps mb-1 opacity-60">AUGUST 2024</h5>
<p class="font-headline-lg text-headline-lg-mobile text-[24px]">Pre-Finals Study Marathon</p>
</div>
</div>
</div>
</section>
</main>
<!-- Footer -->
<footer class="bg-primary text-on-primary border-t border-outline-variant">
  <div class="w-full py-section-v-padding-md px-gutter grid grid-cols-1 md:grid-cols-2 gap-8">
    <div class="flex flex-col gap-6">
      <div class="font-display-xl text-headline-lg text-on-primary">BU SHPE</div>
      <p class="font-body-sm text-body-sm opacity-70 max-w-sm">
        Empowering the Hispanic community at Boston University to realize its fullest potential and impact the world through STEM awareness, access, support, and development.
      </p>
      <div class="flex gap-4">
        <span class="material-symbols-outlined cursor-pointer hover:text-secondary-container transition-colors">public</span>
        <span class="material-symbols-outlined cursor-pointer hover:text-secondary-container transition-colors">groups</span>
        <span class="material-symbols-outlined cursor-pointer hover:text-secondary-container transition-colors">share</span>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-8">
      <div class="flex flex-col gap-4">
        <span class="font-label-caps text-label-caps tracking-widest font-bold">RESOURCES</span>
        <a class="font-body-sm text-body-sm opacity-70 hover:text-secondary-container transition-colors" href="#">CONSTITUTION</a>
        <a class="font-body-sm text-body-sm opacity-70 hover:text-secondary-container transition-colors" href="#">NATIONAL SHPE</a>
      </div>
      <div class="flex flex-col gap-4">
        <span class="font-label-caps text-label-caps tracking-widest font-bold">LEGAL</span>
        <a class="font-body-sm text-body-sm opacity-70 hover:text-secondary-container transition-colors" href="#">PRIVACY POLICY</a>
        <a class="font-body-sm text-body-sm opacity-70 hover:text-secondary-container transition-colors" href="#">ACCESSIBILITY</a>
      </div>
    </div>
  </div>
  <div class="px-gutter py-8 border-t border-outline-variant flex flex-col md:flex-row justify-between items-center gap-4 opacity-50">
    <p class="font-body-sm text-body-sm uppercase tracking-widest text-on-primary">© 2024 BU SHPE. ALL RIGHTS RESERVED.</p>
    <p class="font-body-sm text-body-sm italic font-accent-italic text-on-primary">Advancing Hispanics in STEM since 1974.</p>
  </div>
</footer>


</body></html>

<!-- Events — BU SHPE -->
<!DOCTYPE html><html class="light" lang="en"><head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1.0" name="viewport">
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&amp;family=Inter:wght@400;600&amp;family=Playfair+Display:italic&amp;family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet">
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "surface": "#faf8fe",
                    "surface-container-low": "#f4f3f9",
                    "on-primary": "#ffffff",
                    "tertiary-fixed": "#ffdbd1",
                    "outline": "#757681",
                    "on-secondary": "#ffffff",
                    "inverse-surface": "#2f3035",
                    "on-error": "#ffffff",
                    "on-primary-fixed-variant": "#2d4480",
                    "on-background": "#1a1b20",
                    "on-tertiary-fixed-variant": "#76321f",
                    "inverse-primary": "#b3c5ff",
                    "error-container": "#ffdad6",
                    "surface-container": "#efedf3",
                    "secondary-fixed-dim": "#ffb59d",
                    "on-tertiary": "#ffffff",
                    "on-primary-fixed": "#00184a",
                    "inverse-on-surface": "#f2f0f6",
                    "surface-bright": "#faf8fe",
                    "surface-container-lowest": "#ffffff",
                    "error": "#ba1a1a",
                    "primary-fixed-dim": "#b3c5ff",
                    "tertiary": "#240400",
                    "background": "#faf8fe",
                    "on-secondary-container": "#5a1700",
                    "outline-variant": "#c5c6d1",
                    "surface-dim": "#dbd9df",
                    "on-surface": "#1a1b20",
                    "secondary-fixed": "#ffdbd0",
                    "tertiary-fixed-dim": "#ffb5a0",
                    "primary-container": "#001f5b",
                    "secondary-container": "#fd652f",
                    "on-surface-variant": "#444650",
                    "surface-container-highest": "#e3e2e7",
                    "primary-fixed": "#dbe1ff",
                    "surface-variant": "#e3e2e7",
                    "surface-container-high": "#e9e7ed",
                    "on-tertiary-container": "#ca745c",
                    "on-tertiary-fixed": "#3b0900",
                    "surface-tint": "#465c99",
                    "on-primary-container": "#7389ca",
                    "tertiary-container": "#481002",
                    "secondary": "#ac3400",
                    "primary": "#000c2e",
                    "on-error-container": "#93000a",
                    "on-secondary-fixed-variant": "#842600",
                    "on-secondary-fixed": "#390b00"
            },
            "borderRadius": {
                    "DEFAULT": "0.125rem",
                    "lg": "0.25rem",
                    "xl": "0.5rem",
                    "full": "0.75rem"
            },
            "spacing": {
                    "grid-40": "40%",
                    "section-v-padding-md": "6rem",
                    "section-v-padding-lg": "8rem",
                    "grid-60": "60%",
                    "gutter": "2rem"
            },
            "fontFamily": {
                    "display-xl": ["Barlow Condensed"],
                    "label-caps": ["Barlow Condensed"],
                    "headline-lg": ["Barlow Condensed"],
                    "eyebrow-bold": ["Barlow Condensed"],
                    "headline-lg-mobile": ["Barlow Condensed"],
                    "body-sm": ["Inter"],
                    "accent-italic": ["Playfair Display"],
                    "body-main": ["Inter"]
            },
            "fontSize": {
                    "display-xl": ["72px", {"lineHeight": "1.0", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                    "label-caps": ["12px", {"lineHeight": "1.0", "letterSpacing": "0.1em", "fontWeight": "600"}],
                    "headline-lg": ["48px", {"lineHeight": "1.1", "fontWeight": "700"}],
                    "eyebrow-bold": ["16px", {"lineHeight": "1.2", "letterSpacing": "0.05em", "fontWeight": "600"}],
                    "headline-lg-mobile": ["36px", {"lineHeight": "1.1", "fontWeight": "700"}],
                    "body-sm": ["14px", {"lineHeight": "1.5", "fontWeight": "400"}],
                    "accent-italic": ["inherit", {"fontWeight": "400"}],
                    "body-main": ["18px", {"lineHeight": "1.6", "fontWeight": "400"}]
            }
          },
        },
      }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .orange-tick::before {
            content: '';
            display: block;
            width: 24px;
            height: 4px;
            background-color: #fd652f;
            margin-bottom: 8px;
        }
    </style>
</head>
<body class="bg-surface text-on-surface font-body-main selection:bg-secondary-container selection:text-on-secondary-container">
<!-- TopNavBar -->
<nav class="bg-primary dark:bg-primary text-on-primary dark:text-on-primary font-label-caps text-label-caps uppercase tracking-widest docked full-width top-0 border-b border-outline-variant flex justify-between items-center w-full px-gutter py-4 max-w-full z-50 sticky">
<div class="font-display-xl text-headline-lg-mobile text-on-primary tracking-tighter">BU SHPE</div>
<div class="hidden md:flex gap-8">
<a class="text-on-primary opacity-80 hover:text-secondary-container transition-colors duration-300" href="#">ABOUT</a>
<a class="text-on-primary opacity-80 hover:text-secondary-container transition-colors duration-300" href="#">MEMBERSHIP</a>
<a class="text-secondary-container font-bold border-b-2 border-secondary-container" href="#">EVENTS</a>
<a class="text-on-primary opacity-80 hover:text-secondary-container transition-colors duration-300" href="#">RESOURCES</a>
<a class="text-on-primary opacity-80 hover:text-secondary-container transition-colors duration-300" href="#">PARTNERS</a>
<a class="text-on-primary opacity-80 hover:text-secondary-container transition-colors duration-300" href="#">CONTACT</a>
</div>
<button class="bg-secondary-container text-primary font-bold px-6 py-2 rounded-lg hover:scale-95 transition-transform duration-150">JOIN NOW</button>
</nav>
<main>
<!-- Hero Section -->
<header class="relative w-full bg-primary pt-section-v-padding-lg pb-section-v-padding-md px-gutter overflow-hidden">
<div class="max-w-7xl mx-auto relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
<div class="md:col-span-8">
<span class="text-on-primary-container font-label-caps text-label-caps tracking-[0.2em] mb-4 block">ANNUAL CONVENTION 2024</span>
<h1 class="font-display-xl text-display-xl text-on-primary max-w-3xl">
                        SHPE <span class="font-accent-italic italic text-secondary-container">national</span> convention.
                    </h1>
<p class="mt-8 text-on-primary-container font-body-main max-w-xl opacity-90">
                        The largest gathering of Hispanic STEM students and professionals in the nation. Join thousands of Familia in a week of career opportunities, technical development, and networking.
                    </p>
</div>
<div class="md:col-span-4 flex md:justify-end">
<div class="border-l border-outline-variant pl-6 py-2">
<p class="font-label-caps text-label-caps text-on-primary opacity-60 mb-2">LOCATION</p>
<p class="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-primary leading-none">ANAHEIM, CA</p>
</div>
</div>
</div>
<!-- Decorative background element -->
<div class="absolute right-0 bottom-0 opacity-10 pointer-events-none select-none">
<span class="font-display-xl text-[240px] leading-none text-on-primary translate-y-1/4 inline-block">SHPE</span>
</div>
</header>
<!-- Stats Strip -->
<section class="bg-surface-container-high border-b border-outline-variant py-12 px-gutter">
<div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-24 transition-all duration-700 opacity-100 translate-y-0">
<div class="flex flex-col">
<span class="font-display-xl text-display-xl text-primary leading-none">9,000+</span>
<span class="font-label-caps text-label-caps text-on-surface-variant mt-2 tracking-widest">ATTENDEES</span>
</div>
<div class="flex flex-col">
<span class="font-display-xl text-display-xl text-primary leading-none">200+</span>
<span class="font-label-caps text-label-caps text-on-surface-variant mt-2 tracking-widest">CAREER FAIR BOOTHS</span>
</div>
<div class="flex flex-col">
<span class="font-display-xl text-display-xl text-primary leading-none">100+</span>
<span class="font-label-caps text-label-caps text-on-surface-variant mt-2 tracking-widest">WORKSHOPS</span>
</div>
</div>
</section>
<!-- Editorial Content: Zig-Zag Blocks -->
<section class="py-section-v-padding-lg bg-surface space-y-32">
<!-- Block 1: Travel Logistics (60/40 Split) -->
<div class="px-gutter max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-10 gap-16 items-center transition-all duration-700 opacity-100 translate-y-0">
<div class="md:col-span-6">
<img alt="Travel Logistics" class="w-full aspect-[16/9] object-cover grayscale hover:grayscale-0 transition-all duration-500 border border-outline-variant" data-alt="A cinematic, low-angle shot of a modern airport terminal with wide glass windows reflecting a sunset of orange and navy blue. Professional student travelers in business casual attire walk briskly through the hall, pulling sleek luggage. The lighting is crisp and high-contrast, emphasizing a sense of motion and professional urgency in a flat, editorial photography style." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCihTCndIjQX2OWdMCQK0dkyOqb2etmW8sibzhrINzhfQetR8xcfJ7izq3puhZnkvVCfOTUMkXTZF5XM0KxtTwFyNc10jKYSl9rVb5PyHhBqtZRmELDkynQi1pobwrC0s_1aHD0FEw8Fxguqqz0gy8t-agn3LPap6SZzEplGBQscvjWk_LW3W4UoZON21lPq8ggHBVLXywDL37Nx8bXV5g2NPVxQRNd2UX795oOE-rLl-govTbV9whA5gY8PdZxsGVBNSsV_RYggZk">
</div>
<div class="md:col-span-4">
<div class="orange-tick"></div>
<h2 class="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-6">Travel Logistics</h2>
<p class="text-on-surface-variant mb-8">
                        Coordinating travel for fifty students requires precision. BU SHPE provides subsidized flights, hotel blocks at the convention center, and ground transportation for all registered members.
                    </p>
<ul class="space-y-4 font-label-caps text-label-caps text-primary">
<li class="flex items-center gap-3">
<span class="w-2 h-2 bg-primary"></span> GROUP FLIGHT DEPARTURES
                        </li>
<li class="flex items-center gap-3">
<span class="w-2 h-2 bg-primary"></span> HOTEL SUBSIDY PROGRAM
                        </li>
<li class="flex items-center gap-3">
<span class="w-2 h-2 bg-primary"></span> LOGISTICS BRIEFING OCT 15
                        </li>
</ul>
</div>
</div>
<div class="w-full border-t border-outline-variant opacity-30 transition-all duration-700 opacity-100 translate-y-0"></div>
<!-- Block 2: Career Fair Prep (40/60 Split Reversed) -->
<div class="px-gutter max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-10 gap-16 items-center transition-all duration-700 opacity-100 translate-y-0">
<div class="md:col-span-4 order-2 md:order-1">
<div class="orange-tick"></div>
<h2 class="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-6">Career Fair Prep</h2>
<p class="text-on-surface-variant mb-8">
                        The SHPE National Career Fair is a high-stakes environment. We host intensive "Bootcamp" sessions covering resume audits, elevator pitches, and mock interviews with our corporate partners.
                    </p>
<button class="bg-primary text-on-primary font-label-caps text-label-caps px-8 py-4 rounded-lg flex items-center gap-2 group">
                        DOWNLOAD PREP GUIDE
                        <span class="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
</button>
</div>
<div class="md:col-span-6 order-1 md:order-2">
<img alt="Career Fair Preparation" class="w-full aspect-[4/3] object-cover border border-outline-variant" data-alt="A high-key, wide shot of a bustling professional career fair with corporate booths featuring logos from Fortune 500 tech companies. Students in tailored navy suits engage in earnest conversations with recruiters. The atmosphere is vibrant and intellectual, lit with bright, overhead convention lighting and a clean, brutalist architectural background." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDa3SPhlRQ4BolvL0rxjaidey-XW0Gd_EhFfHbA8esNmmf9NEKFgOHR6SDQwUhWE3TjVGkF67bzLmm5rOf0FHgTChk2-RMgpZtkro5RvzwwemIK5hsJEaLRYlrAxcQMuIk22eppudD62lZ4AlA38_Jc9DJuaYNqMqZI1_Rk1sYT0a1oTP7yABGOT9gFoiTboZYvAd1flXdE7Ti8jMTU_h6V-qan3JV5AqOTOCv1zTgGTAAOELr2cEJe22YqlVx5WXWtK1qPi-PIQXk">
</div>
</div>
<div class="w-full border-t border-outline-variant opacity-30 transition-all duration-700 opacity-100 translate-y-0"></div>
<!-- Block 3: Competitions (60/40 Split) -->
<div class="px-gutter max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-10 gap-16 items-center transition-all duration-700 opacity-100 translate-y-0">
<div class="md:col-span-6">
<img alt="Competitions" class="w-full aspect-[16/9] object-cover grayscale hover:grayscale-0 transition-all duration-500 border border-outline-variant" data-alt="A focused, dramatic close-up of a student engineer's hands working on a complex robotics project with exposed wiring and metallic components. The scene is illuminated by the cool blue glow of an LED screen in a dark, tech-focused environment. The mood is intense and highly professional, utilizing a color palette of deep navy and sharp orange accents." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtY0yMxPzBZyivtSwAsYlFjFIv2UyjD1xSGquvUt9QfwHOYVJKOm9AVxd7N5GhS8cH5HuwkqtlPWuiCjeAdc_LePXbSDgpKUXglNo5tGyKIMgF4r6sazTCxPJmmJMNtpeNNwBG-jx1lVB6DK3K3Ub25iyYZ5TSaEVUSoGeWYjkwaXsyFEdknaQK0a7u2yKERv9BEz23jKUXf3R7wxmiW29GzdmK7oW1EbmlFAl-9PXgVbizF1eUJo08rn1JmaeXsALDdBrQ77SCeI">
</div>
<div class="md:col-span-4">
<div class="orange-tick"></div>
<h2 class="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-6">Competitions</h2>
<p class="text-on-surface-variant mb-8">
                        Represent BU on the national stage. From Extreme Engineering to the Hackathon, our members compete against the top engineering talent in the country for prestige and prizes.
                    </p>
<div class="bg-surface-container-low p-6 border-l-4 border-secondary-container">
<p class="font-label-caps text-label-caps text-secondary font-bold mb-2">LAST YEAR'S RECORD</p>
<p class="font-body-sm italic">"1st Place in the Nissan Design Challenge &amp; Top 5 in the Boeing Tech Paper Competition."</p>
</div>
</div>
</div>
</section>
<!-- Closing CTA -->
<section class="bg-[#000c2e] text-[#faf8fe] py-24 px-gutter relative overflow-hidden">
  <div class="max-w-4xl mx-auto text-center relative z-10">
    <h2 class="font-display-xl text-5xl md:text-7xl mb-8">Ready to represent BU?</h2>
    <p class="text-[#faf8fe] font-body-main text-lg mb-12 max-w-2xl mx-auto opacity-90">
      Join our delegation and take the next step in your professional journey. Registration interest forms are now open for the 2024 National Convention.
    </p>
    <button class="bg-[#fd652f] text-[#000c2e] font-display-xl text-2xl px-12 py-5 rounded-lg hover:bg-[#ff8a5e] transition-all hover:scale-105 active:scale-95 uppercase tracking-tighter">
      REGISTER INTEREST
    </button>
  </div>
  <div class="absolute -bottom-24 -left-24 w-96 h-96 border-4 border-[#faf8fe] rounded-full opacity-5"></div>
</section>
</main>
<!-- Footer -->
<footer class="bg-[#000c2e] text-[#faf8fe] py-20 px-gutter">
  <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
    <div class="md:col-span-1">
      <div class="font-display-xl text-4xl mb-6">BU SHPE</div>
      <p class="text-sm opacity-70 leading-relaxed mb-6">Empowering the Hispanic community at Boston University to realize its fullest potential and to impact the world through STEM awareness, access, support, and development.</p>
      <div class="flex gap-4">
        <a href="#" class="opacity-70 hover:opacity-100 transition-opacity"><span class="material-symbols-outlined">public</span></a>
        <a href="#" class="opacity-70 hover:opacity-100 transition-opacity"><span class="material-symbols-outlined">alternate_email</span></a>
      </div>
    </div>
    <div class="md:col-span-1">
      <h4 class="font-label-caps text-sm tracking-widest opacity-40 mb-6 uppercase">Navigation</h4>
      <ul class="space-y-3 text-sm opacity-70">
        <li class=""><a href="#" class="hover:text-[#fd652f] transition-colors">About</a></li>
        <li class=""><a href="#" class="hover:text-[#fd652f] transition-colors">Membership</a></li>
        <li class=""><a href="#" class="hover:text-[#fd652f] transition-colors">Events</a></li>
        <li class=""><a href="#" class="hover:text-[#fd652f] transition-colors">Resources</a></li>
      </ul>
    </div>
    <div class="md:col-span-1">
      <h4 class="font-label-caps text-sm tracking-widest opacity-40 mb-6 uppercase">Organization</h4>
      <ul class="space-y-3 text-sm opacity-70">
        <li class=""><a href="#" class="hover:text-[#fd652f] transition-colors">Constitution</a></li>
        <li class=""><a href="#" class="hover:text-[#fd652f] transition-colors">National SHPE</a></li>
        <li class=""><a href="#" class="hover:text-[#fd652f] transition-colors">Partners</a></li>
      </ul>
    </div>
    <div class="md:col-span-1">
      <h4 class="font-label-caps text-sm tracking-widest opacity-40 mb-6 uppercase">Legal</h4>
      <ul class="space-y-3 text-sm opacity-70">
        <li class=""><a href="#" class="hover:text-[#fd652f] transition-colors">Privacy Policy</a></li>
        <li class=""><a href="#" class="hover:text-[#fd652f] transition-colors">Accessibility</a></li>
      </ul>
    </div>
  </div>
  <div class="max-w-7xl mx-auto border-t border-white/10 mt-16 pt-8 text-xs opacity-40 font-label-caps tracking-widest text-center md:text-left">
    © 2024 BU SHPE. ALL RIGHTS RESERVED.
  </div>
</footer>
<script>
        // Simple scroll reveal effect for editorial blocks
        const observerOptions = {
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('opacity-100', 'translate-y-0');
                    entry.target.classList.remove('opacity-0', 'translate-y-8');
                }
            });
        }, observerOptions);

        document.querySelectorAll('section > div').forEach(el => {
            el.classList.add('transition-all', 'duration-700', 'opacity-0', 'translate-y-8');
            observer.observe(el);
        });
    </script>


</body></html>
