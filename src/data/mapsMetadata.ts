const MAPS_METADATA: Record<string, any> = {
  equasep: {
    name: "Pharmacie Equasep",
    address: "Avenue du Marché, Centre-ville, Ebolowa",
    phone: "+237 6 99 11 22 01",
    hours: "Lun–Sam 08:00–19:00, Dim 09:00–13:00",
    lat: 2.9156,
    lng: 11.1547,
    mapsUrl: "https://www.google.com/maps/place/Equasep+pharma+(pharmacie)/@2.9229721,11.1309314,15z/data=!4m15!1m7!2m6!1sPharmacies!3m4!2zMsKwNTQnNTYuMiJOIDExwrAwOScxNi45IkU!4m2!1d11.1546944!2d2.9156111!3m6!1s0x10884f005e44c46d:0x80a02ae6d8c8fff1!8m2!3d2.9230052!4d11.1499745!15sCgpQaGFybWFjaWVzkgEIcGhhcm1hY3ngAQA!16s%2Fg%2F11y12lcrb5?entry=ttu&g_ep=EgoyMDI2MDYwMS4wIKXMDSoASAFQAw%3D%3D",
    images: [
      "https://lh3.googleusercontent.com/gps-cs-s/APNQkAHNtmuzrbskEffWiKBzn4VRGmlbd7B7IkeK_8jbS3y99tT2gBpKeuse7ppl1XpfGY7BEW2t2S-4jCe7pdbHhYADVIoZQp_9UBI-0LXfAXNn7aXnW4NweCqpODKxF58PhFLqXIiMPml5zhU=w360-h270-k-no"
    ]
  },
  samba: {
    name: "Pharmacie Samba",
    address: "Carrefour Nko'ovos, Ebolowa",
    phone: "+237 6 99 11 22 02",
    hours: "Lun–Sam 08:00–20:00, Dim 09:00–14:00",
    lat: 2.9089,
    lng: 11.1492,
    mapsUrl: "https://www.google.com/maps/place/PHARMACIE+SAMBA/@2.9229721,11.1309314,15z/data=!4m15!1m7!2m6!1sPharmacies!3m4!2zMsKwNTQnNTYuMiJOIDExwrAwOScxNi45IkU!4m2!1d11.1546944!2d2.9156111!3m6!1s0x10884fc51447e117:0x298ede5d7cf798ad!8m2!3d2.9101999!4d11.1487734!15sCgpQaGFybWFjaWVzWgwiCnBoYXJtYWNpZXOSAQhwaGFybWFjeZoBI0NoWkRTVWhOTUc5blMwVkpRMEZuU1VSVU1XVnRWMDUzRUFF4AEA-gEECAAQJQ!16s%2Fg%2F11r9hbgtr?entry=ttu&g_ep=EgoyMDI2MDYwMS4wIKXMDSoASAFQAw%3D%3D",
    images: []
  },
  renaissance: {
    name: "Pharmacie Renaissance",
    address: "Route d'Angalé, Ebolowa",
    phone: "+237 6 99 11 22 03",
    hours: "Lun–Sam 08:00–19:30",
    lat: 2.9201,
    lng: 11.1603,
    mapsUrl: "https://www.google.com/maps/place/PHARMACIE+DE+LA+RENAISSANCE/@2.9229721,11.1309314,15z/data=!4m15!1m7!2m6!1sPharmacies!3m4!2zMsKwNTQnNTYuMiJOIDExwrAwOScxNi45IkU!4m2!1d11.1546944!2d2.9156111!3m6!1s0x10884e2c61138743:0xa1508307647fb3d0!8m2!3d2.9244769!4d11.1549747!15sCgpQaGFybWFjaWVzkgEIcGhhcm1hY3ngAQA!16s%2Fg%2F11h19d9jb?entry=ttu&g_ep=EgoyMDI2MDYwMS4wIKXMDSoASAFQAw%3D%3D",
    images: []
  },
  bercail: {
    name: "Pharmacie du Bercail",
    address: "Quartier Mvog-Betsi, Ebolowa",
    phone: "+237 6 99 11 22 04",
    hours: "Lun–Sam 07:30–19:00, Dim 10:00–13:00",
    lat: 2.9123,
    lng: 11.1621,
    mapsUrl: "https://www.google.com/maps/place/pharmacie+du+bercail+Ebolowa/@2.9229721,11.1309314,15z/data=!4m15!1m7!2m6!1sPharmacies!3m4!2zMsKwNTQnNTYuMiJOIDExwrAwOScxNi45IkU!4m2!1d11.1546944!2d2.9156111!3m6!1s0x10884fd2a5c29cbb:0x6898e0dbfe9f27d3!8m2!3d2.9207253!4d11.1511613!15sCgpQaGFybWFjaWVzWgwiCnBoYXJtYWNpZXOSAQhwaGFybWFjeZoBRENpOURRVWxSUVVOdlpFTm9kSGxqUmpsdlQyMTRUMDF0VGtaUFZURldWV3M1YjA1dVl6RlRNRzh6VWtZNE1sZ3hSUkFC4AEA-gEECAAQFg!16s%2Fg%2F1hff48jcc?entry=ttu&g_ep=EgoyMDI2MDYwMS4wIKXMDSoASAFQAw%3D%3D",
    images: []
  },
  mvila: {
    name: "Pharmacie de la Mvila",
    address: "Avenue de la Mvila, Ebolowa",
    phone: "+237 6 99 11 22 05",
    hours: "Lun–Sam 08:00–19:00",
    lat: 2.9034,
    lng: 11.1558,
    mapsUrl: "https://www.google.com/maps/place/Pharmacie+la+Mvila/@2.9193027,11.1322613,15z/data=!4m15!1m7!2m6!1sPharmacies!3m4!2zMsKwNTQnNTYuMiJOIDExwrAwOScxNi45IkU!4m2!1d11.1546944!2d2.9156111!3m6!1s0x10884fcd44a8d899:0xd3af8b6a861aa99a!8m2!3d2.9193027!4d11.1513157!15sCgpQaGFybWFjaWVzWgwiCnBoYXJtYWNpZXOSAQhwaGFybWFjeeABAA!16s%2Fg%2F11gz_4lr0?entry=ttu&g_ep=EgoyMDI2MDYwMS4wIKXMDSoASAFQAw%3D%3D",
    images: []
  },
  elites: {
    name: "Pharmacie des Élites",
    address: "Camp SIC, Ebolowa",
    phone: "+237 6 99 11 22 06",
    hours: "Lun–Sam 08:00–20:00, Dim 09:00–13:00",
    lat: 2.9178,
    lng: 11.1489,
    mapsUrl: "https://www.google.com/maps/@2.9172112,11.1542589,20.25z?entry=ttu&g_ep=EgoyMDI2MDYwMS4wIKXMDSoASAFQAw%3D%3D",
    images: []
  },
  destinee: {
    name: "Pharmacie Destinée",
    address: "Route de Nkoémvone, Ebolowa",
    phone: "+237 6 99 11 22 07",
    hours: "Lun–Sam 08:00–19:00",
    lat: 2.8967,
    lng: 11.1456,
    mapsUrl: "https://www.google.com/maps/place/Pharmacie+les+destin%C3%A9es+Ebolowa/@2.9153996,11.1652709,17.74z/data=!4m10!1m2!2m1!1spharmacies!3m6!1s0x108851005e97a719:0x3d20f08569ffb944!8m2!3d2.9144908!4d11.1671124!15sCgpwaGFybWFjaWVzkgEIcGhhcm1hY3ngAQA!16s%2Fg%2F11y02whvzh?entry=ttu&g_ep=EgoyMDI2MDYwMS4wIKXMDSoASAFQAw%3D%3D",
    images: []
  }
};

export default MAPS_METADATA;
