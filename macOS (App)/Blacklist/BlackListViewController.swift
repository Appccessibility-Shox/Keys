//
//  BlackListViewController.swift
//  Keys
//
//  Created by Patrick Botros on 5/4/20.
//  Copyright © 2020 Patrick Botros. All rights reserved.
// swiftlint:disable force_cast

import Cocoa

class BlackListViewController: NSViewController, NSTableViewDataSource, NSTableViewDelegate, NSWindowDelegate, NSTextFieldDelegate {

    typealias Website = String

    var blacklist: [Website] = defaults?.stringArray(forKey: "blacklist") ?? [Website]()

    @IBAction func plusButtonClicked(_ sender: Any) {
        appendEmptySite()
    }

    func control(_ control: NSControl, textView: NSTextView, doCommandBy commandSelector: Selector) -> Bool {
        if commandSelector == #selector(NSResponder.insertNewline(_:)) {
            appendEmptySite()
            return true
        }
        return false
    }

    @IBOutlet weak var tableView: GridClipTableView!

    func appendEmptySite() {
        blacklist = blacklist.filter({!$0.isEmpty})
        blacklist.append("")
        tableView.reloadData()
        if blacklist.count > 0 {
            tableView.scrollRowToVisible(blacklist.count-1)
        }
    }

    func numberOfRows(in tableView: NSTableView) -> Int {
        return blacklist.count
    }

    func tableView(_ tableView: NSTableView, viewFor tableColumn: NSTableColumn?, row: Int) -> NSView? {
        let websiteCellReuseID = NSUserInterfaceItemIdentifier(rawValue: "WebsiteCellReuseID")
        if let cell = tableView.makeView(withIdentifier: websiteCellReuseID, owner: nil) as? WebsiteCell {
            cell.label.rowNumber = row
            cell.label.stringValue = blacklist[row]
            cell.label.focusRingType = NSFocusRingType.none
            cell.label.delegate = self
            return cell
        }
        return nil
    }

    func controlTextDidChange(_ obj: Notification) {
        let label = obj.object as! RowedLabel
        let row = label.rowNumber!
        blacklist[row] = label.stringValue
        defaults?.set(blacklist, forKey: "blacklist")
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        appendEmptySite()
        tableView.headerView = nil
        tableView.selectionHighlightStyle = .none
        self.view.window?.isMovableByWindowBackground = true
    }

    override func viewDidAppear() {
        self.view.window?.delegate = self
    }

    func windowWillClose(_ notification: Notification) {
        defaults?.set(blacklist, forKey: "blacklist")
    }

}

class GridClipTableView: NSTableView {

    override var gridColor: NSColor {
        get {
            return NSColor(named: "grid_color")!
        }
        set {
            super.gridColor = newValue
        }
    }

    override func drawGrid(inClipRect clipRect: NSRect) { }

}

class RowedLabel: NSTextField {
    var rowNumber: Int?
}

class WebsiteCell: NSTableRowView {
    @IBOutlet weak var label: RowedLabel!
}
