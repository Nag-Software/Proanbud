'use client';

import React from 'react';

const PilotAgreementPreview = () => {

  return (

    <section className="bg-white py-20 px-4">

      <div className="max-w-4xl mx-auto">

        <h2 className="text-3xl font-bold text-center mb-8">Pilotavtale</h2>

        <div className="bg-gray-50 p-8 rounded-lg mb-8">

          <h3 className="text-xl font-semibold mb-4">Nøkkelpunkter</h3>

          <ul className="list-disc list-inside space-y-2 text-gray-700">

            <li>Varighet: 3 måneder fra signering</li>

            <li>Pris: 99 kr/måned for å dekke AI- og serverkostnader</li>

            <li>Databehandling: I henhold til personvernpolicy</li>

            <li>Oppsigelse: 14 dagers skriftlig oppsigelse</li>

          </ul>

        </div>

        <div className="text-center">

          <a

            href="/pilotavtale"

            download

            className="bg-primary text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary/90 transition-colors inline-block"

            onClick={() => {

              if (window.posthog) {

                window.posthog.capture('pilot_agreement_downloaded');

              }

            }}

          >

            Last ned pilotavtale (PDF)

          </a>

        </div>

      </div>

    </section>

  );

};

export default PilotAgreementPreview;