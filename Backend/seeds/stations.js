/**
 * seeds/stations.js
 *
 * Seed data for all sampling stations — coordinates converted from
 * UTM Zone 44N (from Sample Coordinates.xlsx) to WGS84 lat/lng.
 */

const stations = [
  {
    "code": "SBW1",
    "name": "SBW1 (GW)",
    "source": "GW",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.353062706116695,
    "longitude": 82.97058594165632,
    "sampleFile": "SBW1_ALL_COMPOUNDS"
  },
  {
    "code": "SBW2",
    "name": "SBW2 (GW)",
    "source": "GW",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.301684812791322,
    "longitude": 82.71348743089949,
    "sampleFile": "SBW2_ALL_COMPOUNDS"
  },
  {
    "code": "SBW3",
    "name": "SBW3 (GW)",
    "source": "GW",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.41308000639031,
    "longitude": 82.57407873326196,
    "sampleFile": "SBW3_ALL_COMPOUNDS"
  },
  {
    "code": "SBW4",
    "name": "SBW4 (GW)",
    "source": "GW",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.47819601472272,
    "longitude": 82.33818634623066,
    "sampleFile": "SBW4_ALL_COMPOUNDS"
  },
  {
    "code": "SBW5",
    "name": "SBW5 (GW)",
    "source": "GW",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.67097945539255,
    "longitude": 82.44209391119307,
    "sampleFile": "SBW5_ALL_COMPOUNDS"
  },
  {
    "code": "SBW6_1",
    "name": "SBW6_1 (GW)",
    "source": "GW",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.735955053034722,
    "longitude": 81.90893113357153,
    "sampleFile": "SBW6_1_ALL_Compounds"
  },
  {
    "code": "SBW6_2",
    "name": "SBW6_2 (GW)",
    "source": "GW",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.735955053034722,
    "longitude": 81.90893113357153,
    "sampleFile": "SBW6_2_ALL_Compounds"
  },
  {
    "code": "SD1",
    "name": "SD1 (WW)",
    "source": "WW",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.41407900113123,
    "longitude": 82.57791199746228,
    "sampleFile": "SD1_ALL_Compounds"
  },
  {
    "code": "SD2",
    "name": "SD2 (WW)",
    "source": "WW",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.386101003770634,
    "longitude": 82.61666399720507,
    "sampleFile": "SD2_ALL_Compounds"
  },
  {
    "code": "SD4",
    "name": "SD4 (WW)",
    "source": "WW",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.321492566195154,
    "longitude": 82.95573656672245,
    "sampleFile": "SD4_ALL_COMPOUNDS"
  },
  {
    "code": "SD3",
    "name": "SD3 (WW)",
    "source": "WW",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.380187388312788,
    "longitude": 82.78272845009712,
    "sampleFile": "SD3_ALL_Compounds"
  },
  {
    "code": "SG1_1",
    "name": "SG1_1 (SW)",
    "source": "SW",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.20907225073746,
    "longitude": 82.93288911603456,
    "sampleFile": "SG1_1_ALL_COMPOUNDS"
  },
  {
    "code": "SG1_2",
    "name": "SG1_2 (SW)",
    "source": "SW",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.20907225073746,
    "longitude": 82.93288911603456,
    "sampleFile": "SG1_2_ALL_COMPOUNDS"
  },
  {
    "code": "SG2",
    "name": "SG2 (SW)",
    "source": "SW",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.270402377972445,
    "longitude": 83.01677888684456,
    "sampleFile": "SG2_ALL_Compounds"
  },
  {
    "code": "SG3",
    "name": "SG3 (SW)",
    "source": "SW",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.324251412771904,
    "longitude": 83.03383823077269,
    "sampleFile": "SG3_ALL_Compounds"
  },
  {
    "code": "SG4",
    "name": "SG4 (SW)",
    "source": "SW",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.32816390675495,
    "longitude": 83.09365340765045,
    "sampleFile": "SG4_ALL_Compounds"
  },
  {
    "code": "SP4",
    "name": "SP4 (SW)",
    "source": "SW",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.428825187211316,
    "longitude": 82.8274471448058,
    "sampleFile": "SP4_ALL_Compounds"
  },
  {
    "code": "SP5",
    "name": "SP5 (SW)",
    "source": "SW",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.356873692976563,
    "longitude": 82.95550553094591,
    "sampleFile": "SP5_ALL_Compounds"
  },
  {
    "code": "SP3",
    "name": "SP3 (SW)",
    "source": "SW",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.46805390232314,
    "longitude": 82.42055819675433,
    "sampleFile": "SP3_ALL_Compounds"
  },
  {
    "code": "SP2",
    "name": "SP2 (SW)",
    "source": "SW",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.685019742457552,
    "longitude": 82.40160334644433,
    "sampleFile": "SP2_ALL_Compounds"
  },
  {
    "code": "SP1",
    "name": "SP1 (SW)",
    "source": "SW",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.662787880812473,
    "longitude": 82.18803062440237,
    "sampleFile": "SP1_ALL_Compounds"
  },
  {
    "code": "SS1",
    "name": "SS1 (STP)",
    "source": "STP",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.34708838811943,
    "longitude": 83.04738469847585,
    "sampleFile": "SS1_ALL_Compounds"
  },
  {
    "code": "SS2",
    "name": "SS2 (STP)",
    "source": "STP",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.34708838811943,
    "longitude": 83.04738469847585,
    "sampleFile": "SS2_ALL_Compounds"
  },
  {
    "code": "SS3",
    "name": "SS3 (STP)",
    "source": "STP",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.34708838811943,
    "longitude": 83.04738469847585,
    "sampleFile": "SS3_ALL_Compounds"
  },
  {
    "code": "SS4",
    "name": "SS4 (STP)",
    "source": "STP",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.34708838811943,
    "longitude": 83.04738469847585,
    "sampleFile": "SS4_ALL_COMPOUNDS"
  },
  {
    "code": "SV4",
    "name": "SV4 (SW)",
    "source": "SW",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.330811880512492,
    "longitude": 83.04439623866138,
    "sampleFile": "SV4_ALL_Compounds"
  },
  {
    "code": "SV3_1",
    "name": "SV3_1 (SW)",
    "source": "SW",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.387500655555236,
    "longitude": 82.8542789067312,
    "sampleFile": "SV3_1_ALL_Compounds"
  },
  {
    "code": "SV3_2",
    "name": "SV3_2 (SW)",
    "source": "SW",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.387500655555236,
    "longitude": 82.8542789067312,
    "sampleFile": "SV3_2_ALL_Compounds"
  },
  {
    "code": "SV2",
    "name": "SV2 (SW)",
    "source": "SW",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.441141443398035,
    "longitude": 82.70199130850472,
    "sampleFile": "SV2_ALL_Compounds"
  },
  {
    "code": "SW1",
    "name": "SW1 (GW)",
    "source": "GW",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.353062706116695,
    "longitude": 82.97058594165632,
    "sampleFile": "SW1_ALL_Compounds"
  },
  {
    "code": "SW2",
    "name": "SW2 (GW)",
    "source": "GW",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.301684812791322,
    "longitude": 82.71348743089949,
    "sampleFile": "SW2_ALL_Compounds"
  },
  {
    "code": "SW3",
    "name": "SW3 (GW)",
    "source": "GW",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.41308000639031,
    "longitude": 82.57407873326196,
    "sampleFile": "SW3_ALL_Compounds"
  },
  {
    "code": "SW4",
    "name": "SW4 (GW)",
    "source": "GW",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.47819601472272,
    "longitude": 82.33818634623066,
    "sampleFile": "SW4_ALL_Compounds"
  },
  {
    "code": "SW5",
    "name": "SW5 (GW)",
    "source": "GW",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.67097945539255,
    "longitude": 82.44209391119307,
    "sampleFile": "SW5_ALL_COMPOUNDS"
  },
  {
    "code": "SW6",
    "name": "SW6 (GW)",
    "source": "GW",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.56667624661614,
    "longitude": 82.03942854099039,
    "sampleFile": "SW6_ALL_Compounds"
  },
  {
    "code": "SW7",
    "name": "SW7 (GW)",
    "source": "GW",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": 25.735955053034722,
    "longitude": 81.90893113357153,
    "sampleFile": "SW7_ALL_COMPOUNDS"
  },
  {
    "code": "ST1",
    "name": "ST1 (Tap Water)",
    "source": "Tap Water",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": null,
    "longitude": null,
    "sampleFile": "ST1_ALL_Compounds"
  },
  {
    "code": "ST2",
    "name": "ST2 (Tap Water)",
    "source": "Tap Water",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": null,
    "longitude": null,
    "sampleFile": null
  },
  {
    "code": "SDW1",
    "name": "SDW1 (Control)",
    "source": "Control",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": null,
    "longitude": null,
    "sampleFile": "SDW1_ALL_COMPOUNDS"
  },
  {
    "code": "SV1",
    "name": "SV1 (Control)",
    "source": "Control",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": null,
    "longitude": null,
    "sampleFile": "SV1_ALL_COMPOUNDS"
  },
  {
    "code": "SG5",
    "name": "SG5 (SW)",
    "source": "SW",
    "sampleFile": "SG5_ALL_Compounds",
    "river": "Ganga",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "latitude": null,
    "longitude": null
  }
];

module.exports = { stations };
