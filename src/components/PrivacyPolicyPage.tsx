import LegalPageLayout from './LegalPageLayout';

const CONTACT_EMAIL = 'blog.cottage627@passinbox.com';
const OWNER_NAME = 'Aitor Sánchez Gutiérrez';

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Política de Privacidad" updatedAt="15 de septiembre de 2026">
      <p>
        Esta Política de Privacidad explica qué datos recopila <strong>BolAitor 3D Globe</strong> ("la app", "nosotros"),
        cómo se usan y qué opciones tienes al respecto. BolAitor 3D Globe es un proyecto personal desarrollado por{' '}
        {OWNER_NAME}.
      </p>

      <h2>1. Qué datos recopilamos</h2>
      <p>Recopilamos únicamente los datos necesarios para que la app funcione:</p>
      <ul>
        <li>
          <strong>Datos de tu cuenta</strong>: si inicias sesión, recibimos tu nombre, correo electrónico y foto de
          perfil a través de <strong>Clerk</strong> (nuestro proveedor de autenticación) y, si eliges continuar con
          Google, a través de tu cuenta de Google.
        </li>
        <li>
          <strong>Fotos que subes</strong>: las imágenes que añades a tus "globos" (colecciones). Si no has iniciado
          sesión, estas fotos existen solo en la memoria de tu navegador durante esa sesión. Si has iniciado sesión,
          se guardan en tu propio Google Drive (ver sección 2).
        </li>
        <li>
          <strong>Cookies de sesión</strong>: Clerk usa una cookie para mantener tu sesión iniciada. No usamos
          cookies de publicidad ni de seguimiento entre sitios.
        </li>
      </ul>
      <p>No recopilamos datos de pago ni información sensible. No mostramos anuncios.</p>

      <h2>2. Acceso a Google Drive</h2>
      <p>
        Si conectas tu cuenta de Google, la app solicita el permiso{' '}
        <code>https://www.googleapis.com/auth/drive.file</code>. Este permiso es intencionadamente limitado:
      </p>
      <ul>
        <li>Solo podemos ver, crear, modificar o eliminar los archivos y carpetas que la propia app ha creado.</li>
        <li>
          <strong>Nunca</strong> tenemos acceso al resto de tu Google Drive: no podemos ver ni tocar archivos que no
          hayas subido a través de esta app.
        </li>
        <li>
          Tus fotos se guardan dentro de una carpeta llamada "BolAitor 3D Globe" en tu propio Drive, organizadas en
          subcarpetas por cada globo/colección que crees.
        </li>
      </ul>

      <h2>3. Con quién compartimos datos</h2>
      <p>No vendemos ni alquilamos tus datos a nadie. Usamos los siguientes proveedores para operar la app:</p>
      <ul>
        <li><strong>Clerk</strong> — gestión de registro, login y sesión.</li>
        <li><strong>Google</strong> — inicio de sesión con Google y almacenamiento de tus fotos en tu propio Drive.</li>
        <li>
          <strong>Cloudflare</strong> — aloja la aplicación y las funciones que permiten obtener tu token de Drive de
          forma segura y resolver los enlaces de "Compartir un globo".
        </li>
      </ul>
      <p>Cada uno de estos proveedores tiene su propia política de privacidad.</p>

      <h2>4. Enlaces de globos compartidos</h2>
      <p>
        Si usas la función "Compartir este globo", generamos un enlace público de solo lectura. Cualquier persona
        que tenga ese enlace podrá ver las fotos de ese globo concreto, sin iniciar sesión. Tus archivos de Drive no
        se hacen públicos: las fotos se sirven a través de nuestro servidor, que verifica el enlace en cada
        solicitud. Puedes desactivar el enlace en cualquier momento desde la app; deja de funcionar al instante.
      </p>

      <h2>5. Cuánto tiempo conservamos tus datos</h2>
      <p>
        Tus fotos y colecciones permanecen en tu Google Drive hasta que tú las elimines desde la app (o directamente
        desde Drive). Si eliminas un globo desde la app, se elimina también su carpeta correspondiente en Drive. Al
        cerrar sesión o revocar el acceso de la app desde tu cuenta de Google, dejamos de poder acceder a tu Drive.
      </p>

      <h2>6. Tus opciones y derechos</h2>
      <ul>
        <li>Puedes eliminar fotos o globos individuales en cualquier momento desde "Mis globos".</li>
        <li>Puedes revocar el acceso de la app a tu Google Drive desde la configuración de tu cuenta de Google.</li>
        <li>Puedes desactivar cualquier enlace de globo compartido en cualquier momento.</li>
        <li>Puedes solicitarnos la eliminación de tus datos de cuenta escribiendo a {CONTACT_EMAIL}.</li>
      </ul>

      <h2>7. Menores de edad</h2>
      <p>
        Esta app no está dirigida a menores de 13 años y no recopila conscientemente datos de menores de esa edad.
      </p>

      <h2>8. Cambios en esta política</h2>
      <p>
        Podemos actualizar esta política ocasionalmente. Publicaremos cualquier cambio en esta misma página con una
        nueva fecha de actualización.
      </p>

      <h2>9. Contacto</h2>
      <p>Si tienes preguntas sobre esta política, escríbenos a {CONTACT_EMAIL}.</p>
    </LegalPageLayout>
  );
}
