"use client";

import { motion } from "framer-motion";

export function AboutContent() {
  return (
    <div className="mx-auto w-full max-w-4xl px-margin-mobile py-stack-lg md:px-margin-desktop">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="mb-8 font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary md:text-headline-lg">
          Nossa História
        </h1>

        <div className="space-y-8">
          <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
            <p className="mb-4 font-body-md leading-relaxed text-on-surface-variant">
              A Rádio Coringão nasceu em 2009, fruto da paixão de quatro torcedores pelo Sport Club Corinthians Paulista.
              Entre eles, estava Ginaldo de Vasconcelos Filho, que permanece no projeto até hoje. A ideia surgiu com um
              propósito simples, mas ambicioso: levar informação sobre o Corinthians diretamente ao torcedor, com uma
              linguagem própria e conteúdo feito por quem vive intensamente o clube.
            </p>
            <p className="mb-4 font-body-md leading-relaxed text-on-surface-variant">
              No início, a Rádio Coringão era associada ao próprio Corinthians, sendo reconhecida como a rádio oficial
              do clube e contando com espaço no site institucional. Essa parceria marcou o começo de uma nova era na
              cobertura esportiva alvinegra, sendo o primeiro veículo segmentado dedicado exclusivamente ao Corinthians.
            </p>
            <p className="mb-4 font-body-md leading-relaxed text-on-surface-variant">
              Com o tempo, a Rádio Coringão seguiu um caminho independente — decisão fundamental para garantir
              liberdade editorial e a possibilidade de informar com transparência, sem abrir mão do olhar crítico
              quando necessário.
            </p>
            <p className="mb-4 font-body-md leading-relaxed text-on-surface-variant">
              Entre 2010 e 2015, a emissora viveu seu auge, consolidando-se como uma das principais rádios
              segmentadas de clubes de futebol no Brasil, com transmissões de jogos, programas de debate e uma
              audiência crescente em todo o país.
            </p>
            <p className="mb-4 font-body-md leading-relaxed text-on-surface-variant">
              Nesse período, a Rádio Coringão foi pioneira em programas de entrevistas e debates esportivos ao
              vivo nas redes sociais — um formato que hoje é amplamente utilizado, mas que teve início ainda em
              nossas transmissões no Facebook.
            </p>
            <p className="mb-4 font-body-md leading-relaxed text-on-surface-variant">
              Atualmente, a Rádio Coringão vive um novo momento. Em plena era digital, o projeto retoma seu
              protagonismo, ampliando sua presença nas redes sociais e fortalecendo seus canais de comunicação.
            </p>
            <p className="mb-4 font-body-md leading-relaxed text-on-surface-variant">
              Hoje, a rádio alcança cerca de 200 mil ouvintes por mês em suas transmissões pelo YouTube e
              RadiosNet. Somente no YouTube, são mais de 300 mil visualizações mensais, enquanto no Instagram,
              os conteúdos sobre jogos e notícias do Timão ultrapassam 7 milhões de visualizações a cada 30 dias.
            </p>
            <p className="mb-4 font-body-md leading-relaxed text-on-surface-variant">
              Desde sua fundação, a Rádio Coringão tem a vocação e a missão de ser a primeira escola de
              jornalismo para muitos repórteres, comentaristas, narradores e produtores que hoje atuam em
              grandes veículos de comunicação — como Luiz Teixeira, Chris Lima, De Paula, entre outros.
            </p>
            <p className="font-body-md leading-relaxed text-on-surface-variant">
              Mais do que uma emissora, a Rádio Coringão é uma comunidade de corinthianos para corinthianos,
              que há mais de uma década mantém viva a missão de informar, emocionar e representar fielmente
              a Nação Alvinegra.
            </p>
          </section>

          <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
            <h2 className="mb-4 font-headline-md text-headline-md text-primary">
              Missão
            </h2>
            <p className="font-body-md leading-relaxed text-on-surface-variant">
              Ser a voz autêntica do torcedor corinthiano.
              Levar informação de qualidade, emoção e verdade em cada transmissão — conectando a Fiel à
              história, ao presente e ao futuro do Sport Club Corinthians Paulista.
              A Rádio Coringão existe para fortalecer o sentimento de pertencimento e valorizar a
              grandeza do manto alvinegro, com uma comunicação feita de torcedor para torcedor.
            </p>
          </section>

          <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
            <h2 className="mb-4 font-headline-md text-headline-md text-primary">
              Visão
            </h2>
            <p className="font-body-md leading-relaxed text-on-surface-variant">
              Ser reconhecida como a principal referência em comunicação esportiva corinthiana,
              preservando a essência da Fiel e inspirando novas gerações a viverem o Corinthians
              com paixão, respeito e orgulho.
              Queremos ser o elo entre a memória, a atualidade e o futuro do Timão — mostrando
              que ser Corinthians é mais do que torcer, é pertencer.
            </p>
          </section>

          <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
            <h2 className="mb-4 font-headline-md text-headline-md text-primary">
              Valores
            </h2>
            <ul className="space-y-3 font-body-md leading-relaxed text-on-surface-variant">
              <li><strong>Paixão e Identidade:</strong> vivemos o Corinthians em cada palavra, som e gesto.</li>
              <li><strong>Autenticidade e Verdade:</strong> nossa voz é livre, comprometida com a realidade e com a emoção da arquibancada.</li>
              <li><strong>Respeito à Fiel:</strong> o torcedor é o centro de tudo; cada conteúdo é feito para e por corinthianos.</li>
              <li><strong>Tradição e História:</strong> honramos e celebramos as conquistas, ídolos e símbolos que nos moldaram.</li>
              <li><strong>Unidade e Pertencimento:</strong> somos uma só nação — unidos pelo amor ao Corinthians.</li>
              <li><strong>Transparência e Credibilidade:</strong> informamos com ética, clareza e responsabilidade.</li>
            </ul>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
