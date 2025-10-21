'use client';

import React, { useState } from 'react';

const SignupForm = () => {

  const [formData, setFormData] = useState({

    firma: '',

    navn: '',

    stilling: '',

    email: '',

    telefon: '',

    antallForslag: '',

    startTidspunkt: '',

    acceptAgreement: false,

  });

  const [errors, setErrors] = useState({});

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {

    const { name, value, type, checked } = e.target;

    setFormData({

      ...formData,

      [name]: type === 'checkbox' ? checked : value,

    });

  };

  const validate = () => {

    const newErrors = {};

    if (!formData.firma) newErrors.firma = 'Firma er påkrevd';

    if (!formData.navn) newErrors.navn = 'Navn er påkrevd';

    if (!formData.stilling) newErrors.stilling = 'Stillings-tittel er påkrevd';

    if (!formData.email) newErrors.email = 'E-post er påkrevd';

    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Ugyldig e-post';

    if (!formData.antallForslag) newErrors.antallForslag = 'Antall forslag er påkrevd';

    if (!formData.startTidspunkt) newErrors.startTidspunkt = 'Ønsket starttidspunkt er påkrevd';

    if (!formData.acceptAgreement) newErrors.acceptAgreement = 'Du må akseptere å laste ned pilotavtalen';

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;

  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!validate()) return;

    try {

      const response = await fetch('/api/pilot-signup', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify(formData),

      });

      if (response.ok) {

        setIsSubmitted(true);

        // Track event

        if (window.posthog) {

          window.posthog.capture('pilot_form_submitted', {

            company: formData.firma,

            email: formData.email,

            proposals_per_month: formData.antallForslag,

          });

        }

      } else {

        alert('Feil ved innsending');

      }

    } catch (error) {

      alert('Feil ved innsending');

    }

  };

  if (isSubmitted) {

    return (

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">

        <div className="bg-white p-8 rounded-lg max-w-md">

          <h2 className="text-2xl font-bold mb-4">Takk!</h2>

          <p className="mb-4">Vi har mottatt forespørselen. Du får en e-post med pilotavtalen og neste steg innen 24 timer.</p>

          <a href="/proanbud-pilotavtale.pdf" download className="bg-[#82ffb2] text-gray-900 px-4 py-2 rounded">Last ned pilotavtale</a>

          <button onClick={() => setIsSubmitted(false)} className="ml-4 text-gray-600">Lukk</button>

        </div>

      </div>

    );

  }

  return (

    <section className="bg-gray-50 py-20 px-4">

      <div className="max-w-2xl mx-auto">

        <h2 className="text-3xl font-bold text-center mb-8">Bli pilotkunde</h2>

        <form onSubmit={handleSubmit} className="space-y-6">

          <div>

            <label htmlFor="firma" className="block text-sm font-medium text-gray-700">Firma</label>

            <input

              type="text"

              id="firma"

              name="firma"

              value={formData.firma}

              onChange={handleChange}

              className="mt-1 block w-full border border-gray-300 rounded-md p-2"

              aria-describedby={errors.firma ? "firma-error" : undefined}

            />

            {errors.firma && <p id="firma-error" className="text-red-600 text-sm">{errors.firma}</p>}

          </div>

          <div>

            <label htmlFor="navn" className="block text-sm font-medium text-gray-700">Navn</label>

            <input

              type="text"

              id="navn"

              name="navn"

              value={formData.navn}

              onChange={handleChange}

              className="mt-1 block w-full border border-gray-300 rounded-md p-2"

            />

            {errors.navn && <p className="text-red-600 text-sm">{errors.navn}</p>}

          </div>

          <div>

            <label htmlFor="stilling" className="block text-sm font-medium text-gray-700">Stillings-tittel</label>

            <input

              type="text"

              id="stilling"

              name="stilling"

              value={formData.stilling}

              onChange={handleChange}

              className="mt-1 block w-full border border-gray-300 rounded-md p-2"

            />

            {errors.stilling && <p className="text-red-600 text-sm">{errors.stilling}</p>}

          </div>

          <div>

            <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-post</label>

            <input

              type="email"

              id="email"

              name="email"

              value={formData.email}

              onChange={handleChange}

              className="mt-1 block w-full border border-gray-300 rounded-md p-2"

            />

            {errors.email && <p className="text-red-600 text-sm">{errors.email}</p>}

          </div>

          <div>

            <label htmlFor="telefon" className="block text-sm font-medium text-gray-700">Telefon (valgfritt)</label>

            <input

              type="tel"

              id="telefon"

              name="telefon"

              value={formData.telefon}

              onChange={handleChange}

              className="mt-1 block w-full border border-gray-300 rounded-md p-2"

            />

          </div>

          <div>

            <label htmlFor="antallForslag" className="block text-sm font-medium text-gray-700">Antall forslag per måned</label>

            <select

              id="antallForslag"

              name="antallForslag"

              value={formData.antallForslag}

              onChange={handleChange}

              className="mt-1 block w-full border border-gray-300 rounded-md p-2"

            >

              <option value="">Velg</option>

              <option value="1-10">1-10</option>

              <option value="11-50">11-50</option>

              <option value="51-100">51-100</option>

              <option value="100+">100+</option>

            </select>

            {errors.antallForslag && <p className="text-red-600 text-sm">{errors.antallForslag}</p>}

          </div>

          <div>

            <label htmlFor="startTidspunkt" className="block text-sm font-medium text-gray-700">Ønsket starttidspunkt</label>

            <input

              type="date"

              id="startTidspunkt"

              name="startTidspunkt"

              value={formData.startTidspunkt}

              onChange={handleChange}

              className="mt-1 block w-full border border-gray-300 rounded-md p-2"

            />

            {errors.startTidspunkt && <p className="text-red-600 text-sm">{errors.startTidspunkt}</p>}

          </div>

          <div className="flex items-center">

            <input

              type="checkbox"

              id="acceptAgreement"

              name="acceptAgreement"

              checked={formData.acceptAgreement}

              onChange={handleChange}

              className="h-4 w-4 text-[#82ffb2] border-gray-300 rounded"

            />

            <label htmlFor="acceptAgreement" className="ml-2 text-sm text-gray-700">Ja, jeg vil laste ned pilotavtalen</label>

          </div>

          {errors.acceptAgreement && <p className="text-red-600 text-sm">{errors.acceptAgreement}</p>}

          <button type="submit" className="w-full bg-primary text-white py-3 rounded-lg font-semibold cursor-pointer hover:bg-primary/90">Send inn</button>

        </form>

      </div>

    </section>

  );

};

export default SignupForm;