import React, { useState, useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  Button,
  IconButton,
  Field,
  Input,
  Modal,
  ConfirmDialog,
  StatusBadge,
  SegmentedControl,
  Table,
  TableRow,
  TableCell,
  BrandMark,
} from "./index.js";
import { Shield, Trash2 } from "lucide-react";

afterEach(() => {
  cleanup();
});

describe("Pustaka Komponen Dasar (Base Components)", () => {
  describe("B1. Button & IconButton", () => {
    it("klik tombol biasa memanggil handler onClick", () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Simpan</Button>);

      const btn = screen.getByRole("button", { name: "Simpan" });
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("tombol dengan prop loading memblokir klik dan memasang atribut aria-busy", () => {
      const handleClick = vi.fn();
      render(
        <Button loading onClick={handleClick}>
          Proses
        </Button>,
      );

      const btn = screen.getByRole("button", { name: "Proses" });
      expect(btn).toHaveAttribute("aria-busy", "true");
      expect(btn).toBeDisabled();

      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it("IconButton tanpa prop label memunculkan peringatan/error konsol pengembangan", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      render(<IconButton icon={Trash2} />);

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it("IconButton dengan label yang valid memasang aria-label dan title", () => {
      render(<IconButton icon={Trash2} label="Hapus data" />);
      const btn = screen.getByRole("button", { name: "Hapus data" });
      expect(btn).toHaveAttribute("aria-label", "Hapus data");
      expect(btn).toHaveAttribute("title", "Hapus data");
    });
  });

  describe("B2. Field & Input", () => {
    it("label terhubung otomatis ke input lewat id dan htmlFor", () => {
      render(
        <Field label="Alamat Website" hint="Masukkan domain resmi">
          <Input placeholder="https://..." />
        </Field>,
      );

      const input = screen.getByLabelText(/Alamat Website/i);
      expect(input).toBeInTheDocument();
      expect(input.id).toBeTruthy();

      const label = screen.getByText("Alamat Website").closest("label");
      expect(label).toHaveAttribute("for", input.id);
    });

    it("pesan galat terhubung lewat aria-describedby dan aria-invalid terpasang", () => {
      render(
        <Field label="Email Petugas" error="Format email tidak valid">
          <Input defaultValue="bukan-email" />
        </Field>,
      );

      const input = screen.getByLabelText(/Email Petugas/i);
      expect(input).toHaveAttribute("aria-invalid", "true");

      const describedBy = input.getAttribute("aria-describedby");
      expect(describedBy).toBeTruthy();

      const errorElement = screen.getByRole("alert");
      expect(errorElement.id).toBe(describedBy);
      expect(errorElement).toHaveTextContent("Format email tidak valid");
    });
  });

  describe("B3. StatusBadge", () => {
    it("selalu merender teks deskriptif dan ikon, bukan hanya mengandalkan warna", () => {
      const { container } = render(<StatusBadge status="clean" />);
      const badge = screen.getByText("Bebas indikasi");
      expect(badge).toBeInTheDocument();

      // Memastikan ada elemen SVG ikon di dalam badge
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("mendukung penimpaan teks custom lewat children", () => {
      render(<StatusBadge status="indicated">Ditemukan 3 Temuan</StatusBadge>);
      expect(screen.getByText("Ditemukan 3 Temuan")).toBeInTheDocument();
    });
  });

  describe("B5. Table & TableRow", () => {
    it("menekan tombol Enter pada TableRow yang memiliki onRowClick memicu handler", () => {
      const handleRowClick = vi.fn();
      render(
        <Table caption="Tabel Uji">
          <tbody>
            <TableRow onRowClick={handleRowClick} data-testid="test-row">
              <TableCell>Konten Sel</TableCell>
            </TableRow>
          </tbody>
        </Table>,
      );

      const row = screen.getByTestId("test-row");
      expect(row).toHaveAttribute("tabindex", "0");
      expect(row).toHaveAttribute("role", "button");

      fireEvent.keyDown(row, { key: "Enter" });
      expect(handleRowClick).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(row, { key: " " });
      expect(handleRowClick).toHaveBeenCalledTimes(2);
    });
  });

  describe("B6. Modal & ConfirmDialog", () => {
    function ModalTester() {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <div>
          <button type="button" onClick={() => setIsOpen(true)}>
            Buka Modal
          </button>
          <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Judul Modal Uji">
            <p>Konten Modal Uji</p>
            <button type="button" onClick={() => setIsOpen(false)}>
              Tutup Dalam
            </button>
          </Modal>
        </div>
      );
    }

    it("modal: terbuka memindahkan fokus ke dalam, Esc menutup, dan fokus kembali ke pemicu", async () => {
      render(<ModalTester />);
      const triggerBtn = screen.getByRole("button", { name: "Buka Modal" });

      triggerBtn.focus();
      expect(document.activeElement).toBe(triggerBtn);

      fireEvent.click(triggerBtn);

      // Modal muncul
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();

      // Tunggu fokus masuk ke dialog atau elemen di dalamnya
      await waitFor(() => {
        expect(dialog.contains(document.activeElement)).toBe(true);
      });

      // Tekan tombol Escape untuk menutup
      fireEvent.keyDown(document, { key: "Escape" });

      // Modal harus tertutup
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });

      // Fokus kembali ke elemen pemicu
      await waitFor(() => {
        expect(document.activeElement).toBe(triggerBtn);
      });
    });

    it("ConfirmDialog: memanggil onConfirm dan onCancel yang tepat", () => {
      const handleConfirm = vi.fn();
      const handleCancel = vi.fn();

      const { rerender } = render(
        <ConfirmDialog
          open={true}
          title="Hapus Situs?"
          description="Apakah Anda yakin?"
          confirmLabel="Ya, Hapus"
          cancelLabel="Batal"
          tone="danger"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />,
      );

      const cancelBtn = screen.getByRole("button", { name: "Batal" });
      fireEvent.click(cancelBtn);
      expect(handleCancel).toHaveBeenCalledTimes(1);

      const confirmBtn = screen.getByRole("button", { name: "Ya, Hapus" });
      fireEvent.click(confirmBtn);
      expect(handleConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe("B8. SegmentedControl", () => {
    function SegmentedTester() {
      const [val, setVal] = useState("a");
      return (
        <SegmentedControl
          value={val}
          onChange={setVal}
          items={[
            { value: "a", label: "Opsi A" },
            { value: "b", label: "Opsi B" },
            { value: "c", label: "Opsi C" },
          ]}
        />
      );
    }

    it("panah kanan dan kiri memindahkan pilihan dan memanggil onChange", () => {
      render(<SegmentedTester />);
      const btnA = screen.getByRole("radio", { name: "Opsi A" });
      expect(btnA).toHaveAttribute("aria-checked", "true");

      const container = btnA.closest(".ui-segmented-control");

      // Tekan panah kanan -> pindah ke Opsi B
      fireEvent.keyDown(container, { key: "ArrowRight" });
      const btnB = screen.getByRole("radio", { name: "Opsi B" });
      expect(btnB).toHaveAttribute("aria-checked", "true");

      // Tekan panah kanan lagi -> pindah ke Opsi C
      fireEvent.keyDown(container, { key: "ArrowRight" });
      const btnC = screen.getByRole("radio", { name: "Opsi C" });
      expect(btnC).toHaveAttribute("aria-checked", "true");

      // Tekan panah kiri -> kembali ke Opsi B
      fireEvent.keyDown(container, { key: "ArrowLeft" });
      expect(screen.getByRole("radio", { name: "Opsi B" })).toHaveAttribute("aria-checked", "true");
    });
  });

  describe("B9. BrandMark", () => {
    it("merender teks identitas resmi Pemkab dan Kominfosandi", () => {
      render(<BrandMark variant="full" />);
      expect(screen.getByText("Pemerintah Kabupaten Sumbawa")).toBeInTheDocument();
      expect(
        screen.getByText("Dinas Komunikasi, Informatika, Statistik dan Persandian"),
      ).toBeInTheDocument();
    });

    it("merender varian compact dengan teks Content Detection", () => {
      render(<BrandMark variant="compact" />);
      expect(screen.getByText("Content Detection")).toBeInTheDocument();
    });

    it("merender monogram fallback 'CD' bila file logo resmi tidak ada", () => {
      render(<BrandMark variant="full" />);
      expect(screen.getByText("CD")).toBeInTheDocument();
    });
  });
});
