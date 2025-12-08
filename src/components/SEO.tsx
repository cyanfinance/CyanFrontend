import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  structuredData?: object;
}

const SEO: React.FC<SEOProps> = ({
  title = 'Cyan Finance - Best Gold Loan Provider in Visakhapatnam | Vizag Gold Loan',
  description = 'Cyan Finance - Best gold loan provider in Visakhapatnam (Vizag). Get secure gold loans at best rates since 2011. Transform your gold into opportunity with competitive loan rates and transparent process.',
  keywords = 'gold loan, gold loan vizag, gold loan visakhapatnam, cyan gold, cyan finance, best gold loan provider, gold loan near me, gold loan rates, secure gold loan, gold loan calculator, best gold loan rates',
  image = '/golditems.png',
  url = 'https://cyangold.in',
  type = 'website',
  structuredData,
}) => {
  const fullTitle = title.includes('Cyan Finance') ? title : `${title} | Cyan Finance`;
  const fullUrl = url.startsWith('http') ? url : `https://cyangold.in${url}`;
  const fullImage = image.startsWith('http') ? image : `https://cyangold.in${image}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Cyan Finance" />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:site_name" content="Cyan Finance" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />

      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;

