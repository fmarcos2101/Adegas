"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";

export type SpecialistLeadState = {
  error?: string;
  success?: string;
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function isValidCpf(cpf: string): boolean {
  const digits = onlyDigits(cpf);
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  const calc = (base: string, factor: number) => {
    let total = 0;
    for (let i = 0; i < base.length; i += 1) {
      total += Number(base[i]) * (factor - i);
    }
    const mod = (total * 10) % 11;
    return mod === 10 ? 0 : mod;
  };

  const d1 = calc(digits.slice(0, 9), 10);
  const d2 = calc(digits.slice(0, 10), 11);
  return d1 === Number(digits[9]) && d2 === Number(digits[10]);
}

const leadSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome"),
  cpf: z.string().trim().min(11, "CPF inválido"),
  email: z.string().trim().email("E-mail inválido"),
  whatsapp: z.string().trim().min(10, "WhatsApp inválido"),
});

export async function specialistLeadAction(
  _prev: SpecialistLeadState,
  formData: FormData,
): Promise<SpecialistLeadState> {
  const parsed = leadSchema.safeParse({
    name: formData.get("name"),
    cpf: formData.get("cpf"),
    email: formData.get("email"),
    whatsapp: formData.get("whatsapp"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { name, email } = parsed.data;
  const cpf = onlyDigits(parsed.data.cpf);
  const whatsapp = onlyDigits(parsed.data.whatsapp);

  if (!isValidCpf(cpf)) {
    return { error: "CPF inválido." };
  }
  if (whatsapp.length < 10 || whatsapp.length > 13) {
    return { error: "Informe um WhatsApp válido com DDD." };
  }

  await prisma.contactLead.create({
    data: { name, cpf, email, whatsapp },
  });

  await prisma.auditLog.create({
    data: {
      action: "LEAD_ESPECIALISTA",
      detail: `${name} · ${email} · ${whatsapp}`,
    },
  });

  return {
    success:
      "Recebemos seus dados! Um especialista da MAF PDV vai falar com você em breve.",
  };
}
