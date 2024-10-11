"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Ensure these imports are correct
import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; // Import the default styles

export default function components() {
  const patients = [
    { name: "Jhon Kural", appointmentDate: "11/03/2020" },
    { name: "Jane Doe", appointmentDate: "12/03/2020" },
    { name: "Bob Smith", appointmentDate: "13/03/2020" },
    { name: "Alice Johnson", appointmentDate: "14/03/2020" },
  ];
  const [selectedOption, setSelectedOption] = useState(""); // State for selected option
  const [namaWali, setNamaWali] = useState(""); // State for namaWali
  const [rt, setRt] = useState(""); // State for RT
  const [rw, setRw] = useState(""); // State for RW
  const [startDate, setStartDate] = useState<Date | null>(null); // Initialize with null

  const handleChange = (value: string) => {
    setSelectedOption(value); // Update selected option

    // Reset namaWali if switching back to "Pribadi"
    if (value === "Pribadi") {
      setNamaWali("");
    }
  };

  return (
    <div className="flex space-x-6">
      {/* Pendaftaran Form */}
      <div className="flex-1 bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-6">Pendaftaran</h2>
        <div className="grid grid-cols-2 gap-4">
          {/* Data Pasien */}
          <div>
            <div className="relative mb-6">
              <hr />
              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-gray-500">
                Data Pasien
              </span>
            </div>
            <Input
              className="mb-4"
              name="namaPasien"
              type="text"
              placeholder="Nama Pasien"
            />
            {/* DatePicker with consistent width */}
            <div className="mb-4">
              <div className="datepicker-wrapper">
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  className="datepicker-input" // Use specific class for DatePicker
                  dateFormat="dd/MM/yyyy" // Format the date as needed
                  placeholderText="Tanggal Lahir" // Placeholder text
                  isClearable // Allow clearing the date
                />
              </div>
            </div>
            <Input
              className="mb-4"
              name="NIK"
              type="number"
              placeholder="NIK"
            />
            {/* Updated dropdown using Select component */}
            <Select onValueChange={handleChange}>
              <SelectTrigger className="w-full mb-6 bg-white border border-gray-300 rounded-md">
                <SelectValue 
                  placeholder="Pilih Kepemilikan NIK" 
                  className="select-placeholder" // Use custom class for placeholder color
                />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="Pribadi">NIK Pribadi</SelectItem>
                <SelectItem value="Wali">NIK Wali</SelectItem>
              </SelectContent>
            </Select>
            {selectedOption === "Wali" && (
              <Input
                className="mb-4"
                name="namaWali"
                type="text"
                placeholder="Nama Wali"
                value={namaWali}
                onChange={(e) => setNamaWali(e.target.value)}
              />
            )}
          </div>

          {/* Alamat Pasien */}
          <div>
            <div className="relative mb-6">
              <hr />
              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-gray-500">
                Alamat Pasien
              </span>
            </div>
            <Input
              className="mb-4"
              name="Dusun"
              type="text"
              placeholder="Dusun"
            />
            <div className="flex space-x-4 mb-4">
              <Input
                className="flex-1"
                name="RT"
                type="number"
                placeholder="RT"
              />
              <Input
                className="flex-1"
                name="RW"
                type="number"
                placeholder="RW"
              />
            </div>
            <Input
              className="mb-4"
              name="Desa"
              type="text"
              placeholder="Desa"
            />
            <Input
              className="mb-4"
              name="Kecamatan"
              type="text"
              placeholder="Kecamatan"
            />
            <Input
              className="mb-4"
              name="Kota"
              type="text"
              placeholder="Kota / Kabupaten"
            />
          </div>
        </div>

        <Button className="w-full mb-4 bg-teal-500 hover:bg-teal-600">
          Log in
        </Button>
      </div>

      {/* Patient List */}
      <div className="flex-1 bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-6">Recent Patients</h2>
        <div className="space-y-4">
          {patients.map((patient, index) => (
            <div
              key={index}
              className="flex items-center justify-between border-b pb-2"
            >
              <div>
                <p className="font-semibold">{patient.name}</p>
                <p className="text-sm text-gray-500">
                  {patient.appointmentDate}
                </p>
              </div>
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}