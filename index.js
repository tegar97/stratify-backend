const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();
app.use(cors());

// import dotenv
require("dotenv").config();



app.use(express.json());
// Fungsi untuk merangkum data
const summarizeData = (data) => {
  // Buat summary data
  const summary = {
    provinsi: data.dataKriminal.nama_provinsi,
    kabupaten_kota: data.dataKriminal.bps_nama_kabupaten_kota,
    kecamatan: data.dataKriminal.kemendagri_nama_kecamatan,
    desa_kelurahan: data.dataKriminal.kemendagri_nama_desa_kelurahan,
  };

  // Rangkum data kriminal
  const dataKriminal = {
    pencurian: data.dataKriminal.terdapat_pencurian,
    penipuan: data.dataKriminal.terdapat_penipuan,
    penganiayaan: data.dataKriminal.terdapat_penganiayaan,
    perkosaaan: data.dataKriminal.terdapat_perkosaan,
    narkoba: data.dataKriminal.terdapat_pengedar_penyalahgunaan_narkoba,
    perjudian: data.dataKriminal.terdapat_perjudian,
    tahun: data.dataKriminal.tahun,
  };

  // Rangkum data kualitas udara
  const dataUdara = {
    indeks_kualitas_lingkungan_hidup:
      data.dataUdara.indeks_kualitas_lingkungan_hidup,
    tahun: data.dataUdara.tahun,
  };

  // Rangkum data terminal
  const dataTerminal = data.dataTerminal.map((terminal) =>
    terminal.nama_terminal.trim()
  );

  // Rangkum data pasar
  const dataPasar = {
    total_pasar_permanen: data.dataPasar.total_pasar_permanen,
    tahun: data.dataPasar.tahun,
  };

  // Rangkum data rumah sakit
  const dataRumahSakit = {
    jumlah_rs: data.dataRumahSakit.jumlah_rs,
    tahun: data.dataRumahSakit.tahun,
  };

  // Rangkum data stasiun
  const dataStation = data.dataStation.map((station) => station.nama_stasiun);

  // Rangkum data upah minimum
  const dataUpahMinimum = {
    upah_minimum: data.dataUpahMinimum.besaran_upah_minimum,
    tahun: data.dataUpahMinimum.tahun,
  };

  // Gabungkan semua rangkuman
  return {
    summary,
    dataKriminal,
    dataUdara,
    dataTerminal,
    dataPasar,
    dataRumahSakit,
    dataStation,
    dataUpahMinimum,
  };
};
app.get("/api/stats", async (req, res) => {
  try {
    const kecamatan = req.query.kecamatan;
    if (!kecamatan) {
      return res.status(400).json({
        message: "Parameter 'kecamatan' is required",
        error: 1,
      });
    }

    // Fetch data kriminalitas berdasarkan kecamatan
    const responseKriminal = await axios.get(
      `https://data.jabarprov.go.id/api-backend/bigdata/dpmdes/idm_dftr_sts_tindak_kejahatan__jenis_kriminalitas?where={"bps_nama_kecamatan":"${kecamatan.toUpperCase()}"}`
    );
    let dataKriminal = responseKriminal.data.data;

    if (dataKriminal.length === 0) {
      return res.status(404).json({
        message: "Data not found for the given kecamatan",
        error: 1,
      });
    }

    // Mapping data dan mengelompokkan berdasarkan tahun
    const dataKriminalGrouped = dataKriminal.reduce((acc, item) => {
      const year = item.tahun;
      if (!acc[year]) {
        acc[year] = {
          kode_provinsi: item.kode_provinsi,
          nama_provinsi: item.nama_provinsi,
          bps_kode_kabupaten_kota: item.bps_kode_kabupaten_kota,
          bps_nama_kabupaten_kota: item.bps_nama_kabupaten_kota,
          bps_kode_kecamatan: item.bps_kode_kecamatan,
          bps_nama_kecamatan: item.bps_nama_kecamatan,
          bps_kode_desa_kelurahan: item.bps_kode_desa_kelurahan,
          bps_nama_desa_kelurahan: item.bps_nama_desa_kelurahan,
          kemendagri_kode_kecamatan: item.kemendagri_kode_kecamatan,
          kemendagri_nama_kecamatan: item.kemendagri_nama_kecamatan,
          kemendagri_kode_desa_kelurahan: item.kemendagri_kode_desa_kelurahan,
          kemendagri_nama_desa_kelurahan: item.kemendagri_nama_desa_kelurahan,
          terdapat_pencurian: 0,
          terdapat_penipuan: 0,
          terdapat_penganiayaan: 0,
          terdapat_pembakaran: 0,
          terdapat_perkosaan: 0,
          terdapat_pengedar_penyalahgunaan_narkoba: 0,
          terdapat_perjudian: 0,
          terdapat_pembunuhan: 0,
          terdapat_perdagangan_manusia: 0,
          tahun: year,
        };
      }

      // Update counts
      acc[year].terdapat_pencurian += item.terdapat_pencurian === "ADA" ? 1 : 0;
      acc[year].terdapat_penipuan += item.terdapat_penipuan === "ADA" ? 1 : 0;
      acc[year].terdapat_penganiayaan +=
        item.terdapat_penganiayaan === "ADA" ? 1 : 0;
      acc[year].terdapat_pembakaran +=
        item.terdapat_pembakaran === "ADA" ? 1 : 0;
      acc[year].terdapat_perkosaan += item.terdapat_perkosaan === "ADA" ? 1 : 0;
      acc[year].terdapat_pengedar_penyalahgunaan_narkoba +=
        item.terdapat_pengedar_penyalahgunaan_narkoba === "ADA" ? 1 : 0;
      acc[year].terdapat_perjudian += item.terdapat_perjudian === "ADA" ? 1 : 0;
      acc[year].terdapat_pembunuhan +=
        item.terdapat_pembunuhan === "ADA" ? 1 : 0;
      acc[year].terdapat_perdagangan_manusia +=
        item.terdapat_perdagangan_manusia === "ADA" ? 1 : 0;

      return acc;
    }, {});

    // Mengubah objek menjadi array
    const resultKriminal = Object.values(dataKriminalGrouped);

    // get data terminal only get the latest years
    const latestDataKriminal = resultKriminal.reduce((latest, current) => {
      return current.tahun > latest.tahun ? current : latest;
    });

    // Ambil nama kabupaten dari data kriminalitas yang ditemukan
    const kabupaten = dataKriminal[0].bps_nama_kabupaten_kota;

    // Fetch data kualitas udara berdasarkan kabupaten
    // Fetch data kualitas udara dari API
    const responseUdara = await axios.get(
      `https://data.jabarprov.go.id/api-backend/bigdata/dlh/od_20488_indeks_kualitas_lingkungan_hidup__kabupatenkota_v1?where={"nama_kabupaten_kota":"${kabupaten.toUpperCase()}"}`
    );
    const dataUdara = responseUdara.data.data;

    if (dataUdara.length === 0) {
      return res.status(404).json({
        message: "Data not found for the given kabupaten",
        error: 1,
      });
    }

    // Mencari data terbaru berdasarkan tahun
    const dataTerbaru = dataUdara.reduce((latest, current) => {
      return current.tahun > latest.tahun ? current : latest;
    });

    // Fetch data terminal berdasarkan kabupaten
    const responseTerminal = await axios.get(
      `https://data.jabarprov.go.id/api-backend/bigdata/dishub/od_18406_daftar_terminal_berdasarkan_kabupatenkota?search=${kabupaten.toUpperCase()}`
    );
    const dataTerminal = responseTerminal.data.data;

    const apiUrl = `https://data.jabarprov.go.id/api-backend/bigdata/dpmdes/idm_jml_pasar_bangunan_permanen__des_kel?where={"bps_nama_kecamatan":"${kecamatan.toUpperCase()}"}`;

    const response = await axios.get(apiUrl);
    let dataPasar = response.data.data;

    if (!dataPasar || dataPasar.length === 0) {
      return res.status(404).json({
        message: `Data not found for kecamatan '${kecamatan}'`,
        error: 1,
      });
    }

    // Normalisasi data dan penghapusan karakter aneh pada kunci
    dataPasar = dataPasar.map((item) => ({
      kode_provinsi: item["ï»¿kode_provinsi"] || item["kode_provinsi"],
      nama_provinsi: item.nama_provinsi,
      bps_kode_kabupaten_kota: item.bps_kode_kabupaten_kota,
      bps_nama_kabupaten_kota: item.bps_nama_kabupaten_kota,
      bps_kode_kecamatan: item.bps_kode_kecamatan,
      bps_nama_kecamatan: item.bps_nama_kecamatan,
      bps_kode_desa_kelurahan: item.bps_kode_desa_kelurahan,
      bps_nama_desa_kelurahan: item.bps_nama_desa_kelurahan,
      kemendagri_kode_kecamatan: item.kemendagri_kode_kecamatan,
      kemendagri_nama_kecamatan: item.kemendagri_nama_kecamatan,
      kemendagri_kode_desa_kelurahan: item.kemendagri_kode_desa_kelurahan,
      kemendagri_nama_desa_kelurahan: item.kemendagri_nama_desa_kelurahan,
      jumlah_pasar_permanen: item.jumlah_pasar_permanen || 0,
      satuan: item.satuan,
      tahun: item.tahun,
      id: item.id,
    }));

    // Mengagregasikan total jumlah pasar permanen di kecamatan
    const totalPasar = dataPasar.reduce(
      (total, item) => total + item.jumlah_pasar_permanen,
      0
    );

    // Menyusun respons akhir
    const dataResultPasar = {
      kode_provinsi: dataPasar[0].kode_provinsi,
      nama_provinsi: dataPasar[0].nama_provinsi,
      bps_kode_kabupaten_kota: dataPasar[0].bps_kode_kabupaten_kota,
      bps_nama_kabupaten_kota: dataPasar[0].bps_nama_kabupaten_kota,
      bps_kode_kecamatan: dataPasar[0].bps_kode_kecamatan,
      bps_nama_kecamatan: dataPasar[0].bps_nama_kecamatan,
      kemendagri_kode_kecamatan: dataPasar[0].kemendagri_kode_kecamatan,
      kemendagri_nama_kecamatan: dataPasar[0].kemendagri_nama_kecamatan,
      total_pasar_permanen: totalPasar,
      satuan: "UNIT",
      tahun: [...new Set(dataPasar.map((item) => item.tahun))], // Daftar tahun yang tersedia
    };

    const responseRumahSakit = await axios.get(
      `https://data.jabarprov.go.id/api-backend/bigdata/dinkes/od_17255_jumlah_rumah_sakit_rs_berdasarkan_kabupatenkota?where={"nama_kabupaten_kota":"${kabupaten.toUpperCase()}"}`
    );
    const dataRumahSakit = responseRumahSakit.data.data;
    if (dataRumahSakit.length === 0) {
      return res.status(404).json({
        message: "Data not found for the given kabupaten",
        error: 1,
      });
    }

    // Filter only get the latest data
    const latestDataRumahSakit = dataRumahSakit.reduce((latest, current) => {
      return current.tahun > latest.tahun ? current : latest;
    });

    // station
    const responseStation = await axios.get(
      `https://data.jabarprov.go.id/api-backend/bigdata/dishub/od_20049_daftar_stasiun_berdasarkan_kabupatenkota?where={"nama_kabupaten_kota":"${kabupaten.toUpperCase()}"}`
    );
    const dataStation = responseStation.data.data;

    // Upah Minimum
    const responseUpahMinimum = await axios.get(
      `https://data.jabarprov.go.id/api-backend/bigdata/disnakertrans/od_19868_daftar_upah_minimum_kabupatenkota_di_drh_prov_jaba_v1?where={"nama_kabupaten_kota":"${kabupaten.toUpperCase()}"}`
    );
    const dataUpahMinimum = responseUpahMinimum.data.data;

    // latest data upah minimum
    const latestDataUpahMinimum = dataUpahMinimum.reduce((latest, current) => {
      return current.tahun > latest.tahun ? current : latest;
    });

    // summary data
    const data = {
      dataKriminal: latestDataKriminal,
      dataUdara: dataTerbaru,
      dataTerminal,
      dataPasar: dataResultPasar,
      dataRumahSakit: latestDataRumahSakit,
      dataStation: dataStation,
      dataUpahMinimum: latestDataUpahMinimum,
    };

    // summary data
    const summary = summarizeData(data);

    res.json({
      message: "Get data successful",
      error: 0,
      data: {
        dataKriminal: latestDataKriminal,
        dataUdara: dataTerbaru,
        dataTerminal,
        dataPasar: dataResultPasar,
        dataRumahSakit: latestDataRumahSakit,
        dataStation: dataStation,
        dataUpahMinimum: latestDataUpahMinimum,
        summary,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch data",
      error: 1,
      details: error.message,
    });
  }
});

// get all data UMP And Index kualitas hidup
app.get("/api/ump", async (req, res) => {
  try {
    // Fetch UMP data
    const responseUmp = await axios.get(
      "https://data.jabarprov.go.id/api-backend/bigdata/disnakertrans/od_19868_daftar_upah_minimum_kabupatenkota_di_drh_prov_jaba_v1"
    );
    const dataUmp = responseUmp.data.data;

    // Get only the latest UMP data
    const latestDataUmp = dataUmp.reduce((latest, current) => {
      return current.tahun > latest.tahun ? current : latest;
    });

    // Fetch environmental quality index data
    const responseIndex = await axios.get(
      "https://data.jabarprov.go.id/api-backend/bigdata/dlh/od_20488_indeks_kualitas_lingkungan_hidup__kabupatenkota_v1"
    );

    const dataIndex = responseIndex.data.data;

    // Get only the latest environmental quality index data
    const latestDataIndex = dataIndex.reduce((latest, current) => {
      return current.tahun > latest.tahun ? current : latest;
    });



    const summaryIndexHidup = {
       name_kabupaten_kota: latestDataIndex.nama_kabupaten_kota,
        indeks_kualitas_lingkungan_hidup: latestDataIndex.indeks_kualitas_lingkungan_hidup,
        };

    const summaryUmp = {
        name_kabupaten_kota: latestDataUmp.nama_kabupaten_kota,
        besaran_upah_minimum: latestDataUmp.besaran_upah_minimum,
        };



    res.json({
      message: "Get data successful",
      error: 0,
      data: {
        ump: summaryUmp,
        indeks_kualitas_lingkungan_hidup: summaryIndexHidup,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch data",
      error: 1,
      details: error.message,
    });
  }
});

// PDF
app.post("/api/summary", async (req, res) => {
  try {
    // get post data

    const data = req.body.data;

    const payload = {
      input: {
        prompt: data,
      },
      parameters: {},
      debug: {},
    };

    const response = await axios.post(
      "https://dashscope-intl.aliyuncs.com/api/v1/apps/460d3d6734814cc2b3d114a368340295/completion",
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.status(200).json({
      message: "Data summarized and sent successfully",
      error: 0,
      data: response.data, // Respons dari API eksternal
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch data",
      error: 1,
      details: error.message,
    });
  }
});
// Start the Express server
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
