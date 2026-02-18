// Certificate Generation Service
// Generates course completion certificates and stores them in Supabase

import { SupabaseClient } from "@supabase/supabase-js";

import { createLogger } from "@lib/logger";

const log = createLogger("service:certificate");

// =============================================================================
// TYPES
// =============================================================================

interface CertificateData {
  userId: string;
  courseId: string;
  userName: string;
  courseName: string;
  completionDate: Date;
}

interface GeneratedCertificate {
  id: string;
  certificateNumber: string;
  issuedAt: string;
  pdfUrl?: string;
}

// =============================================================================
// CERTIFICATE NUMBER GENERATION
// =============================================================================

/**
 * Generate a unique certificate number
 * Format: GYN-COURSE-YYYYMMDD-XXXX (where XXXX is random alphanumeric)
 */
function generateCertificateNumber(): string {
  const date = new Date();
  const dateStr = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");

  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude ambiguous chars
  let random = "";
  for (let i = 0; i < 6; i++) {
    random += chars[Math.floor(Math.random() * chars.length)];
  }

  return `GYN-${dateStr}-${random}`;
}

// =============================================================================
// CERTIFICATE HTML TEMPLATE
// =============================================================================

function generateCertificateHtml(data: CertificateData, certificateNumber: string): string {
  const formattedDate = data.completionDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page { size: landscape; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Georgia', serif;
      width: 1056px;
      height: 816px;
      position: relative;
      background: #ffffff;
    }
    .border-frame {
      position: absolute;
      inset: 20px;
      border: 3px solid #c9a94e;
      border-radius: 8px;
    }
    .inner-frame {
      position: absolute;
      inset: 30px;
      border: 1px solid #e5d5a0;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 60px;
      text-align: center;
    }
    .logo {
      font-size: 18px;
      letter-spacing: 8px;
      text-transform: uppercase;
      color: #c9a94e;
      margin-bottom: 30px;
      font-weight: 600;
    }
    .title {
      font-size: 42px;
      color: #1a1a2e;
      margin-bottom: 12px;
      font-weight: 400;
    }
    .subtitle {
      font-size: 16px;
      color: #666;
      margin-bottom: 40px;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .recipient {
      font-size: 32px;
      color: #c9a94e;
      margin-bottom: 30px;
      font-style: italic;
      border-bottom: 2px solid #e5d5a0;
      padding-bottom: 10px;
      min-width: 400px;
    }
    .description {
      font-size: 16px;
      color: #444;
      line-height: 1.6;
      margin-bottom: 30px;
      max-width: 600px;
    }
    .course-name {
      font-weight: 700;
      color: #1a1a2e;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      width: 100%;
      max-width: 700px;
      margin-top: auto;
    }
    .footer-item {
      text-align: center;
    }
    .footer-value {
      font-size: 14px;
      color: #1a1a2e;
      margin-bottom: 4px;
    }
    .footer-label {
      font-size: 11px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .cert-number {
      font-size: 10px;
      color: #bbb;
      position: absolute;
      bottom: 40px;
      right: 50px;
    }
  </style>
</head>
<body>
  <div class="border-frame"></div>
  <div class="inner-frame">
    <div class="logo">Gynergy</div>
    <h1 class="title">Certificate of Completion</h1>
    <p class="subtitle">This is to certify that</p>
    <p class="recipient">${escapeHtml(data.userName)}</p>
    <p class="description">
      has successfully completed the course
      <span class="course-name">"${escapeHtml(data.courseName)}"</span>
      on the Gynergy platform.
    </p>
    <div class="footer">
      <div class="footer-item">
        <p class="footer-value">${formattedDate}</p>
        <p class="footer-label">Date of Completion</p>
      </div>
      <div class="footer-item">
        <p class="footer-value">${certificateNumber}</p>
        <p class="footer-label">Certificate Number</p>
      </div>
    </div>
  </div>
  <p class="cert-number">Verify at gynergy.app/verify/${certificateNumber}</p>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// =============================================================================
// MAIN SERVICE
// =============================================================================

/**
 * Issue a certificate for a user who completed a course.
 * Checks if certificate already exists before creating.
 */
export async function issueCertificate(
  supabase: SupabaseClient,
  data: CertificateData
): Promise<GeneratedCertificate | null> {
  try {
    // Check if certificate already exists
    const { data: existing } = await supabase
      .from("course_certificates")
      .select("id, certificate_number, issued_at, pdf_url")
      .eq("user_id", data.userId)
      .eq("course_id", data.courseId)
      .single();

    if (existing) {
      log.info("Certificate already exists", {
        userId: data.userId,
        courseId: data.courseId,
        certificateNumber: existing.certificate_number,
      });
      return {
        id: existing.id,
        certificateNumber: existing.certificate_number,
        issuedAt: existing.issued_at,
        pdfUrl: existing.pdf_url,
      };
    }

    const certificateNumber = generateCertificateNumber();

    // Generate HTML for certificate
    const html = generateCertificateHtml(data, certificateNumber);

    // Store HTML as a file in Supabase storage for rendering
    const htmlPath = `certificates/${data.userId}/${certificateNumber}.html`;
    const { error: uploadError } = await supabase.storage
      .from("content")
      .upload(htmlPath, new Blob([html], { type: "text/html" }), {
        upsert: true,
        contentType: "text/html",
      });

    let pdfUrl: string | undefined;
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from("content").getPublicUrl(htmlPath);
      pdfUrl = urlData?.publicUrl;
    } else {
      log.warn("Failed to upload certificate HTML", { error: uploadError });
    }

    // Create certificate record
    const { data: certificate, error: insertError } = await supabase
      .from("course_certificates")
      .insert({
        user_id: data.userId,
        course_id: data.courseId,
        certificate_number: certificateNumber,
        pdf_url: pdfUrl,
        metadata: {
          userName: data.userName,
          courseName: data.courseName,
          completionDate: data.completionDate.toISOString(),
        },
      })
      .select("id, certificate_number, issued_at, pdf_url")
      .single();

    if (insertError) {
      log.error("Failed to create certificate record", { error: insertError });
      return null;
    }

    log.info("Certificate issued", {
      certificateNumber,
      userId: data.userId,
      courseId: data.courseId,
    });

    return {
      id: certificate.id,
      certificateNumber: certificate.certificate_number,
      issuedAt: certificate.issued_at,
      pdfUrl: certificate.pdf_url,
    };
  } catch (error) {
    log.error("Certificate generation failed", { error, data });
    return null;
  }
}

/**
 * Verify a certificate by its number
 */
export async function verifyCertificate(
  supabase: SupabaseClient,
  certificateNumber: string
): Promise<{
  valid: boolean;
  certificate?: {
    userName: string;
    courseName: string;
    issuedAt: string;
    certificateNumber: string;
  };
}> {
  const { data: cert } = await supabase
    .from("course_certificates")
    .select("*, courses(title)")
    .eq("certificate_number", certificateNumber)
    .single();

  if (!cert) {
    return { valid: false };
  }

  return {
    valid: true,
    certificate: {
      userName: cert.metadata?.userName || "Unknown",
      courseName:
        (cert.courses as unknown as { title: string } | undefined)?.title ||
        cert.metadata?.courseName ||
        "Unknown",
      issuedAt: cert.issued_at,
      certificateNumber: cert.certificate_number,
    },
  };
}
