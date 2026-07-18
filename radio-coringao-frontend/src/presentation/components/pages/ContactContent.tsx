"use client";

import { motion } from "framer-motion";

export function ContactContent() {
  return (
    <div className="mx-auto w-full max-w-4xl px-margin-mobile py-stack-lg md:px-margin-desktop">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="mb-8 font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary md:text-headline-lg">
          Fale Conosco
        </h1>

        <div className="space-y-8">
          <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
            <h2 className="mb-4 font-headline-md text-headline-md text-primary">
              Canais de Atendimento
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-md border border-outline-variant p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                  <span className="material-symbols-outlined text-[20px] text-on-secondary">email</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-headline-md text-primary">E-mail</h3>
                  <p className="text-[13px] text-on-surface-variant">radioncoringaocontato@gmail.com</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-md border border-outline-variant p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                  <span className="material-symbols-outlined text-[20px] text-on-secondary">phone</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-headline-md text-primary">Telefone</h3>
                  <p className="text-[13px] text-on-surface-variant">(11) 96064-7414</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
            <h2 className="mb-4 font-headline-md text-headline-md text-primary">
              Envie sua Mensagem
            </h2>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="mb-1 block text-[12px] font-bold text-on-surface-variant">Nome</label>
                <input
                  type="text"
                  placeholder="Seu nome completo"
                  className="w-full rounded-md border border-outline-variant bg-surface px-4 py-3 text-[13px] text-on-surface placeholder:text-on-surface-variant focus:border-secondary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-bold text-on-surface-variant">E-mail</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  className="w-full rounded-md border border-outline-variant bg-surface px-4 py-3 text-[13px] text-on-surface placeholder:text-on-surface-variant focus:border-secondary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-bold text-on-surface-variant">Assunto</label>
                <input
                  type="text"
                  placeholder="Assunto da mensagem"
                  className="w-full rounded-md border border-outline-variant bg-surface px-4 py-3 text-[13px] text-on-surface placeholder:text-on-surface-variant focus:border-secondary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-bold text-on-surface-variant">Mensagem</label>
                <textarea
                  rows={5}
                  placeholder="Escreva sua mensagem..."
                  className="w-full rounded-md border border-outline-variant bg-surface px-4 py-3 text-[13px] text-on-surface placeholder:text-on-surface-variant focus:border-secondary focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-md bg-primary py-3 font-label-sm text-label-sm font-bold text-on-primary transition-colors hover:bg-secondary"
              >
                Enviar Mensagem
              </button>
            </form>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
