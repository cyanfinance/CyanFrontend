import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogUrl?: string;
  type?: string;
  structuredData?: object;
}

const SEO: React.FC<SEOProps> = ({
  title = 'Cyan Finance - Gold Loan in Vizag | Gold Loan in Visakhapatnam | Trusted Since 2011',
  description = 'Cyan Finance offers the best gold loan services in Vizag and Visakhapatnam. Get instant gold loans at competitive rates of ₹7,000 per gram. Most trusted gold loan partner since 2011. Apply now for quick approval!',
  keywords = 'gold loan in vizag, gold loan in visakhapatnam, gold loan vizag, cyan gold, cyan gold loan, cyan finance, gold loan visakhapatnam, best gold loan vizag, instant gold loan, gold loan rates vizag',
  ogImage = '/cyanlogo.png',
  ogUrl = '',
  type = 'website',
  structuredData
}) => {
  // Use the correct domain - cyangold.in based on the SEO report
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.cyangold.in';
  const fullUrl = ogUrl ? `${siteUrl}${ogUrl}` : siteUrl;
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Cyan Finance" />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="geo.region" content="IN-AP" />
      <meta name="geo.placename" content="Visakhapatnam, Vizag" />
      <meta name="geo.position" content="17.6868;83.2185" />
      <meta name="ICBM" content="17.6868, 83.2185" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:site_name" content="Cyan Finance" />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />

      {/* Additional SEO Tags */}
      <meta name="theme-color" content="#0e1353" />
      <link rel="canonical" href={fullUrl} />

      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
