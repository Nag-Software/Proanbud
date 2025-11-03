
      {/* Hero Section with Video */}
      <section className="relative overflow-hidden py-10 lg:py-15 bg-white mt-5 mx-auto">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 relative max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-12 items-center">
            <div className="text-center lg:text-left space-y-7">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#82ffb2]/10 rounded-full border border-[#82ffb2]/20">
                <Sparkles className="w-4 h-4 text-[#82ffb2]" />
                <span className="text-sm font-medium text-gray-700">Norges første AI-drevne tilbudsplattform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-gray-900">
                Send tilbud på
                <span className="bg-gradient-to-r from-[#82ffb2] to-[#82b2ff] bg-clip-text text-transparent"> minutter</span>
                , ikke timer, <span className="italic">med AI</span>
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed max-w-5xl px-10 lg:px-0">
                Din komplette tilbudsplattform for håndverkere. Bruk AI til å prissete riktig, send profesjonelle tilbud fra mobil eller PC, og vinn flere oppdrag.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start" id="bli-pilot">
                <Link
                  href="/pilot"
                  className="group bg-primary text-primary-foreground px-8 py-2.5 rounded-xl hover:bg-primary/90 transition-all font-semibold text-md hover:shadow-md flex items-center justify-center gap-2"
                >
                  Bli Pilotkunde
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/login"
                  className="bg-white text-gray-900 px-8 py-2.5 rounded-xl hover:bg-gray-50 transition-all font-semibold text-md border-2 border-gray-200 flex items-center justify-center gap-2"
                >
                  Se demo
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 pt-0 justify-center lg:justify-start">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-[#82ffb2]" />
                  <span className="text-sm text-gray-600">Gratis i 14 dager</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-[#82ffb2]" />
                  <span className="text-sm text-gray-600">Ingen kredittkort</span>
                </div>
              </div>
            </div>

            {/* Interactive Platform Showcase */}
            <div className="relative hidden md:block ml-0 lg:ml-10">
              <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 max-h-[28rem] overflow-hidden w-full lg:w-[120%] lg:-ml-[10%]">
                {/* Platform Preview Tabs */}
                <div className="flex space-x-1 mb-4 bg-gray-50 p-1 rounded-xl !cursor-none">
                  <button className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-primary rounded-lg transition-all shadow-sm">
                    Dashboard
                  </button>
                  <button className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 rounded-lg">
                    Tilbud
                  </button>
                  <button className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 rounded-lg">
                    Analyse
                  </button>
                </div>

                {/* Dashboard Preview */}
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Dashboard</h3>
                      <p className="text-xs text-gray-600">Nøkkeltall og aktivitet</p>
                    </div>
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shadow-lg">
                      <Users className="w-5 h-5 text-slate-600" />
                    </div>
                  </div>

                  {/* Stats Cards - Using actual KPI Card design */}
                  <div className="grid grid-cols-3 gap-3">
                    <Card className="h-full px-2 py-0 border-slate-200/60 flex flex-col max-h-29">
                      <CardHeader className="flex flex-row items-center justify-between pb-2 flex-shrink-0">
                        <CardTitle className="font-medium text-slate-600 text-xs leading-tight">
                          OMSETNING
                        </CardTitle>
                        <div className="bg-slate-100 rounded-lg flex-shrink-0 p-1.5">
                          <TrendingUp className="w-3 h-3 text-slate-600" />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-1 !px-3 flex-1 flex flex-col justify-between">
                        <div className="font-bold text-slate-800 mb-0.5 ml-2 text-lg leading-tight">
                          +24%
                        </div>
                        <div className="flex items-center gap-1 pt-2 flex-nowrap">
                          <div className="font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 text-xs bg-green-50 text-green-700 border border-green-200">
                            +12%
                          </div>
                          <span className="text-slate-500 text-xs leading-tight whitespace-nowrap">
                            fra forrige måned
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="h-full px-2 py-0 border-slate-200/60 flex flex-col max-h-29">
                      <CardHeader className="flex flex-row items-center justify-between pb-2 flex-shrink-0">
                        <CardTitle className="font-medium text-slate-600 text-xs leading-tight">
                          TILBUD
                        </CardTitle>
                        <div className="bg-slate-100 rounded-lg flex-shrink-0 p-1.5">
                          <FileText className="w-3 h-3 text-slate-600" />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-1 !px-3 flex-1 flex flex-col justify-between">
                        <div className="font-bold text-slate-800 mb-0.5 ml-2 text-lg leading-tight">
                          12
                        </div>
                        <div className="flex items-center gap-1 pt-2 flex-nowrap">
                          <div className="font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 text-xs bg-green-50 text-green-700 border border-green-200">
                            +3
                          </div>
                          <span className="text-slate-500 text-xs leading-tight whitespace-nowrap">
                            fra forrige måned
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="h-full px-2 py-0 border-slate-200/60 flex flex-col max-h-29">
                      <CardHeader className="flex flex-row items-center justify-between pb-2 flex-shrink-0">
                        <CardTitle className="font-medium text-slate-600 text-xs leading-tight">
                          VUNNET
                        </CardTitle>
                        <div className="bg-slate-100 rounded-lg flex-shrink-0 p-1.5">
                          <Check className="w-3 h-3 text-slate-600" />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-1 !px-3 flex-1 flex flex-col justify-between">
                        <div className="font-bold text-slate-800 mb-0.5 ml-2 text-lg leading-tight">
                          8
                        </div>
                        <div className="flex items-center pt-2 gap-1 flex-nowrap">
                          <div className="font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 text-xs bg-green-50 text-green-700 border border-green-200">
                            +2
                          </div>
                          <span className="text-slate-500 text-xs leading-tight whitespace-nowrap">
                            fra forrige måned
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Activity - Using actual ActivityFeed design */}
                  <Card className="h-full flex flex-col max-h-34">
                    <CardHeader className="flex-shrink-0 pb-2">
                      <CardTitle className="text-sm">Siste Aktivitet</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-3">
                      <div className="h-full overflow-y-auto">
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 p-2 rounded-lg">
                            <div className="flex-shrink-0 mt-0.5">
                              <Sparkles className="h-4 w-4 text-blue-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs text-gray-900 truncate">AI-prissetting fullført</p>
                              <p className="text-xs text-gray-600 line-clamp-1">Kjøkkenrenovering - Prosjekt</p>
                              <p className="text-xs text-gray-500 mt-0.5">2 min siden</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 p-2 rounded-lg">
                            <div className="flex-shrink-0 mt-0.5">
                              <Mail className="h-4 w-4 text-blue-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs text-gray-900 truncate">Tilbud sendt</p>
                              <p className="text-xs text-gray-600 line-clamp-1">Badrenovering - Kunde</p>
                              <p className="text-xs text-gray-500 mt-0.5">15 min siden</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 p-2 rounded-lg">
                            <div className="flex-shrink-0 mt-0.5">
                              <Check className="h-4 w-4 text-green-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs text-gray-900 truncate">Tilbud vunnet</p>
                              <p className="text-xs text-gray-600 line-clamp-1">Stueombygging - Bedrift</p>
                              <p className="text-xs text-gray-500 mt-0.5">2 timer siden</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Floating Action Button */}
                <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-xl border-4 border-white">
                  <Zap className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>