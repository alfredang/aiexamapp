import SwiftUI
import PhotosUI

struct NewClaimView: View {
    let type: ClaimType
    var onSubmitted: () -> Void

    @EnvironmentObject private var session: SessionStore
    @Environment(\.dismiss) private var dismiss

    @State private var receiptImage: UIImage?
    @State private var showingCamera = false
    @State private var libraryItem: PhotosPickerItem?
    @State private var title = ""
    @State private var amountText = ""
    @State private var note = ""
    @State private var isSubmitting = false
    @State private var errorMessage: String?

    var body: some View {
        Form {
            Section("Receipt Photo") {
                if let receiptImage {
                    Image(uiImage: receiptImage)
                        .resizable()
                        .scaledToFit()
                        .frame(maxHeight: 280)
                        .frame(maxWidth: .infinity)
                        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                }
                if CameraPicker.isAvailable {
                    Button {
                        showingCamera = true
                    } label: {
                        Label(receiptImage == nil ? "Take Photo of Receipt" : "Retake Photo", systemImage: "camera")
                    }
                }
                PhotosPicker(selection: $libraryItem, matching: .images) {
                    Label("Choose from Library", systemImage: "photo.on.rectangle")
                }
            }

            Section("Details") {
                TextField("What is this claim for?", text: $title)
                HStack {
                    Text("Amount")
                        .foregroundStyle(Theme.mutedInk)
                    TextField("0.00", text: $amountText)
                        .keyboardType(.decimalPad)
                        .multilineTextAlignment(.trailing)
                    Text("SGD")
                        .foregroundStyle(Theme.mutedInk)
                }
                TextField("Note (optional)", text: $note, axis: .vertical)
                    .lineLimit(2...4)
            }

            Section {
                if let errorMessage {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundStyle(.red)
                }
                Button {
                    Task { await submit() }
                } label: {
                    if isSubmitting {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                    } else {
                        Label("Submit \(type.title)", systemImage: "paperplane.fill")
                            .frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(.borderedProminent)
                .tint(Theme.primary)
                .listRowInsets(EdgeInsets())
                .disabled(isSubmitting || receiptImage == nil || title.trimmingCharacters(in: .whitespaces).isEmpty)
            } footer: {
                Text("Your receipt photo is uploaded to the company \(type.title) folder on Google Drive for processing.")
            }
        }
        .navigationTitle(type.title)
        .navigationBarTitleDisplayMode(.inline)
        .fullScreenCover(isPresented: $showingCamera) {
            CameraPicker { image in
                receiptImage = image
            }
            .ignoresSafeArea()
        }
        .onChange(of: libraryItem) {
            guard let libraryItem else { return }
            Task {
                if let data = try? await libraryItem.loadTransferable(type: Data.self),
                   let image = UIImage(data: data) {
                    receiptImage = image
                }
            }
        }
    }

    private func submit() async {
        guard let receiptImage, let photoData = receiptImage.receiptJPEGData() else {
            errorMessage = "Please add a photo of the receipt."
            return
        }
        isSubmitting = true
        defer { isSubmitting = false }
        let request = SubmitClaimRequest(
            type: type,
            title: title.trimmingCharacters(in: .whitespaces),
            amount: Double(amountText.replacingOccurrences(of: ",", with: ".")),
            currency: "SGD",
            note: note.isEmpty ? nil : note,
            photoBase64: photoData.base64EncodedString(),
            filename: "receipt-\(Int(Date().timeIntervalSince1970)).jpg",
            contentType: "image/jpeg"
        )
        do {
            _ = try await session.api.submitClaim(request)
            errorMessage = nil
            onSubmitted()
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
