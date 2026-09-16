import LegalPageLayout from './LegalPageLayout';

const CONTACT_EMAIL = 'blog.cottage627@passinbox.com';
const JURISDICTION = 'España';

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout title="Condiciones del Servicio" updatedAt="15 de septiembre de 2026">
      <p>
        Estas Condiciones del Servicio ("Condiciones") regulan el uso de <strong>BolAitor 3D Globe</strong> ("la
        app"). Al usar la app, aceptas estas Condiciones. Si no estás de acuerdo, no uses la app.
      </p>

      <h2>1. Descripción del servicio</h2>
      <p>
        BolAitor 3D Globe te permite crear colecciones de fotos ("globos") y explorarlas en una galería esférica 3D
        interactiva. Puedes usar la app sin iniciar sesión (las fotos solo viven en tu navegador) o iniciar sesión
        con Google para guardar tus globos en tu propio Google Drive y, opcionalmente, compartirlos mediante un
        enlace público de solo lectura.
      </p>

      <h2>2. Cuentas y acceso con Google</h2>
      <p>
        El registro e inicio de sesión se gestionan a través de Clerk. Si conectas tu cuenta de Google, nos otorgas
        permiso limitado (<code>drive.file</code>) para crear y gestionar únicamente los archivos que la app misma
        crea en tu Drive. Eres responsable de mantener la seguridad de tu cuenta.
      </p>

      <h2>3. Tu contenido</h2>
      <p>
        Las fotos que subes son tuyas: no reclamamos ningún derecho de propiedad sobre ellas. Eres el único
        responsable del contenido que subas y de tener los derechos necesarios sobre él. No subas contenido que
        infrinja derechos de terceros, sea ilegal, o que no tengas permiso para usar.
      </p>

      <h2>4. Enlaces compartidos</h2>
      <p>
        Si activas "Compartir este globo", cualquier persona con el enlace podrá ver esas fotos sin iniciar sesión.
        Eres responsable de decidir qué globos compartes y de desactivar el enlace cuando ya no quieras que esté
        disponible. No nos hacemos responsables del uso que terceros hagan de un enlace que hayas compartido.
      </p>

      <h2>5. Uso aceptable</h2>
      <p>Al usar la app, te comprometes a no:</p>
      <ul>
        <li>Subir contenido ilegal, difamatorio, o que infrinja derechos de propiedad intelectual de terceros.</li>
        <li>Intentar acceder a datos de otros usuarios o vulnerar la seguridad de la app.</li>
        <li>Usar la app para fines distintos a los previstos (una galería personal de fotos en 3D).</li>
      </ul>

      <h2>6. Disponibilidad del servicio</h2>
      <p>
        BolAitor 3D Globe es un proyecto personal ofrecido "tal cual" (as is) y "según disponibilidad", sin garantías
        de ningún tipo, expresas o implícitas. No garantizamos que el servicio esté siempre disponible, libre de
        errores, o que las funciones de terceros (Google, Clerk, Cloudflare) de las que depende funcionen sin
        interrupciones.
      </p>

      <h2>7. Limitación de responsabilidad</h2>
      <p>
        En la medida máxima permitida por la ley, no seremos responsables de ningún daño indirecto, incidental o
        consecuente derivado del uso o la imposibilidad de uso de la app, incluida la pérdida de fotos o datos.
        Te recomendamos conservar copias de tus fotos originales por tu cuenta.
      </p>

      <h2>8. Terminación</h2>
      <p>
        Puedes dejar de usar la app en cualquier momento y revocar el acceso de Google desde la configuración de tu
        cuenta de Google. Podemos suspender o descontinuar la app en cualquier momento, especialmente al tratarse de
        un proyecto personal sin garantía de continuidad.
      </p>

      <h2>9. Cambios en estas Condiciones</h2>
      <p>
        Podemos actualizar estas Condiciones ocasionalmente. Publicaremos cualquier cambio en esta misma página con
        una nueva fecha de actualización.
      </p>

      <h2>10. Ley aplicable</h2>
      <p>Estas Condiciones se rigen por las leyes de {JURISDICTION}, sin perjuicio de los derechos que la normativa de protección al consumidor de tu país de residencia pueda otorgarte.</p>

      <h2>11. Contacto</h2>
      <p>Si tienes preguntas sobre estas Condiciones, escríbenos a {CONTACT_EMAIL}.</p>
    </LegalPageLayout>
  );
}
